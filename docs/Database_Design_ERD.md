# Database Design & Entity-Relationship Document
## GC HOME+ — Supabase PostgreSQL 15

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)
**Note:** Actual DDL (`CREATE TABLE` statements), full column lists, index definitions, and constraint syntax were not provided in the Source Document. The ERD and table descriptions below reflect only the columns, relationships, and RLS statuses explicitly named. Anything beyond that is marked `[NOT SPECIFIED IN SOURCE]`.

---

## 1. Entity-Relationship Diagram

```
                       +-----------------------+
                       |      admin_users      |
                       +-----------------------+
                       | id (PK, UUID)         |
                       | email (UNIQUE)        |
                       | role, is_active       |
                       +-----------------------+
                                   | (reviews/assigns)
                                   v
+------------------+     +-------------------+     +------------------+
|     profiles     |     |   maid_profiles   |     |     services     |
+------------------+     +-------------------+     +------------------+
| id (PK, UUID)    |     | id (PK, UUID)     |     | id (PK, UUID)    |
| full_name        |<--->| full_name         |     | name, category   |
| phone (UNIQUE)   |     | maid_code (UNIQUE)|     | starting_price   |
| role             |     | status, is_online |     | commission_rate  |
| is_active        |     | bank_details      |     | is_active        |
+------------------+     +-------------------+     +------------------+
        |                          |                         |
        |                          | (assigned_maid_id)      |
        +-------------------+      |                         |
                            |      |                         |
                            v      v                         |
                     +--------------------+                  |
                     |      bookings      |<-----------------+
                     +--------------------+
                     | id (PK, UUID)      |
                     | booking_code (UQ)  |
                     | customer_id (FK)   |
                     | maid_id (FK)       |
                     | service_id (FK)    |
                     | status             |
                     | start_otp          |
                     | total_amount       |
                     | commission_amount  |
                     | maid_payout        |
                     +--------------------+
                       |                |
         +-------------+                +-------------+
         v                                            v
+-----------------------------+              +--------------------+
|    booking_timeline_logs    |              |      ratings       |
+-----------------------------+              +--------------------+
| id (PK, UUID)               |              | id (PK, UUID)      |
| booking_id (FK)             |              | booking_id (FK)    |
| old_status, new_status      |              | customer_id (FK)   |
| changed_by, notes           |              | maid_id (FK)       |
+-----------------------------+              | rating / stars     |
                                              | review_text        |
                                              +--------------------+
```

Additionally referenced but not diagrammed above: `maid_kyc_documents`, `transactions`, `app_config`.

## 2. Table Reference

| Table | Purpose | Key Columns (as documented) | RLS Status |
|---|---|---|---|
| `profiles` | Base accounts (customers & maids) | `id`, `full_name`, `phone`, `email`, `role`, `is_active` | ✅ Enabled — self read/write, admin full |
| `maid_profiles` | Partner operational profiles | `id`, `maid_code`, `full_name`, `status`, `is_online`, `rating`, `bank_details` | ✅ Enabled — public read (active only), self update (online status) |
| `maid_kyc_documents` | Verification documents (Aadhaar, PAN) | `id`, `maid_id`, `document_type`, `file_url`, `status`, `verified_by` | ✅ Enabled — admin read/verify, maid self-insert |
| `services` | Cleaning service catalog & pricing | `id`, `name`, `category`, `starting_price`, `commission_rate`, `is_active` | ✅ Enabled — public read (active only), admin manage |
| `bookings` | Service requests & assignments | `id`, `booking_code`, `customer_id`, `maid_id`, `service_id`, `status`, `start_otp`, `total_amount`, `commission_amount`, `maid_payout` | ✅ Enabled — public insert, parties view/update (🔴 depends on Migration 010 — see §4) |
| `booking_timeline_logs` | Immutable lifecycle audit trail | `id`, `booking_id`, `old_status`, `new_status`, `changed_by`, `created_at` | ✅ Enabled — parties read, system/trigger insert |
| `transactions` | Financial ledger & commissions | `id`, `booking_id`, `maid_id`, `amount`, `type`, `status` | ✅ Enabled — admin read, maid reads own |
| `ratings` | Post-service feedback | `id`, `booking_id`, `customer_id`, `maid_id`, `rating`, `review_text` | ✅ Enabled — public read, customer insert |
| `app_config` | System-wide operational parameters | `key`, `value`, `description`, `updated_at` | ✅ Enabled — public read, admin update |
| `admin_users` | Internal console authorized staff | `id`, `email`, `role`, `is_active`, `created_at` | ✅ Enabled — admin auth gate only |

## 3. Migration History

| Migration | Purpose |
|---|---|
| `000_pre_migration_backup.sql` | Pre-migration backup snapshot |
| `001_phase1_foundation.sql` | Foundational schema |
| `002_data_migration.sql` | Data migration step |
| `003_storage_buckets.sql` | Storage bucket setup (`maid-kyc`, `job-photos`, `invoices`) |
| `004_phase2_core_ops.sql` | Core operations schema |
| `005_phase3_financials.sql` | Financial/commission schema |
| `006_phase4_notifications_config.sql` | Notifications & `app_config` |
| `007_operational_functions.sql` | PL/pgSQL stored procedures |
| `008_create_admin_account.sql` | Seeds initial admin account |
| `009_consolidate_and_clean_schema.sql` | Schema consolidation/cleanup |
| `010_seed_and_rls_polish.sql` | Seed data + final RLS policy pass |
| `migrations/tests/` | Automated SQL smoke & regression tests |

Migrations are reported idempotent and sequential (000→010), with "Smoke tests PASS" as-reported status.

## 4. Critical Database Risk — Migration 010

If `010_seed_and_rls_polish.sql` is **not executed** in the Supabase SQL editor, the `bookings` table's RLS defaults to **blocking anonymous/guest booking inserts via REST** — i.e., the core customer booking flow fails silently at the database layer. This is the single highest-priority item in the Source Document's gap analysis (§8, High Priority #1).

**Remediation:** Run `migrations/010_seed_and_rls_polish.sql` against the target Supabase project before any production or staging booking-flow testing.

## 5. Triggers & Stored Procedures

The Source Document confirms the existence of PL/pgSQL stored procedures and RLS triggers, and specifically references:
- A trigger/automation on booking completion that calculates platform commission (15–20% range stated) and credits the maid's wallet balance.
- Audit logging (booking_timeline_logs insert on every status transition).

`[NOT SPECIFIED IN SOURCE]`: exact trigger function names, full DDL, index definitions, foreign key `ON DELETE`/`ON UPDATE` behavior, check constraints, and default values are not provided and should be pulled directly from `migrations/` source files during a follow-up audit.

## 6. Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `maid-kyc` | KYC documents (Aadhaar, PAN, etc.) | Private, signed RLS policy |
| `job-photos` | Before/after job photos | Signed RLS policy |
| `invoices` | Financial documents | Signed RLS policy |

Storage & Media implementation status: 🟡 **Completed (90%)** — Operational.

## 7. Recommended Database Improvements
- Confirm Migration 010 has run in every environment (production, staging) as a deployment gate, not a manual afterthought — add to CI/CD or a startup health check.
- Document full DDL (columns, types, defaults, indexes, FKs) in a schema export (`pg_dump --schema-only`) and attach it to this document for full traceability — currently absent from source material.
- Add explicit indexes on high-traffic filter columns (`bookings.status`, `bookings.customer_id`, `bookings.maid_id`, `maid_profiles.is_online`) if not already present — `[NOT SPECIFIED IN SOURCE]` whether these exist.
- Verify `booking_timeline_logs` and `transactions` retention/partitioning strategy as booking volume grows — not addressed in Source Document.
