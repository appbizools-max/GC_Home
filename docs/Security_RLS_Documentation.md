# Security & Row Level Security (RLS) Documentation
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)

---

## 1. Authentication Model

| Actor | Mechanism | Status |
|---|---|---|
| Customer / Maid | Phone number + OTP via Supabase Auth (GoTrue) | 🟡 Currently demo/simulated OTP — **no production SMS provider connected**. Must not be treated as production-secure until a real provider (Twilio/Fast2SMS) is configured. |
| Super Admin | Email + password via Supabase Auth (GoTrue), gated by `admin_users` table | ✅ Implemented |
| Session persistence | AsyncStorage-backed session (mobile) | ✅ Implemented — standard client-side session storage; token handling specifics `[NOT SPECIFIED IN SOURCE]` |

## 2. Authorization Model
Role gating is enforced at two layers:
1. **Application layer** — `AdminContext` (admin-panel) and `AuthContext` (user-app) gate UI/route access by role.
2. **Database layer** — PostgreSQL Row Level Security (RLS) policies enforce actual data access, independent of client-side checks. This is the layer that actually matters for security, since client-side gating alone is not a security boundary.

## 3. RLS Status by Table

| Table | RLS Enabled | Policy Summary (as documented) |
|---|---|---|
| `profiles` | ✅ | Self read/write; admin full access |
| `maid_profiles` | ✅ | Public read (active maids only); self-update restricted to `is_online`; admin full |
| `maid_kyc_documents` | ✅ | Maid self-insert; admin read/verify |
| `services` | ✅ | Public read (active only); admin manage |
| `bookings` | ✅ (🔴 conditional) | Public insert; parties (customer/maid) view/update; admin full. **Depends on Migration 010 being applied** — see §4 |
| `booking_timeline_logs` | ✅ | Parties read; system/trigger-only insert (not directly client-writable) |
| `transactions` | ✅ | Admin read all; maid reads own |
| `ratings` | ✅ | Public read; customer insert |
| `app_config` | ✅ | Public read; admin update |
| `admin_users` | ✅ | Admin auth gate only |

## 4. Critical Security Finding: Migration 010 Dependency

**Finding:** If `migrations/010_seed_and_rls_polish.sql` has not been executed against a given Supabase project (production or staging), the `bookings` table's RLS **defaults to blocking anonymous/guest inserts via REST**.

**Severity:** High — this is a functional blocker (customers cannot book) rather than a data-exposure risk, but it means RLS state is not guaranteed consistent across environments unless migration execution is enforced procedurally.

**Recommendation:** Treat Migration 010 execution as a **mandatory, verified deployment gate** — not a manual checklist item. Add an automated post-deploy check that queries `pg_policies` for the expected `bookings` insert policy and fails deployment if absent.

## 5. Storage Security
- `maid-kyc`, `job-photos`, `invoices` buckets are governed by **signed RLS policies** — i.e., access requires a signed URL rather than public bucket access. ✅
- KYC documents (Aadhaar, PAN) are inherently sensitive PII; the Source Document does not specify encryption-at-rest configuration beyond Supabase's platform defaults, retention policy, or deletion/right-to-erasure handling. `[NOT SPECIFIED IN SOURCE]`

## 6. Payment Security
- Payment layer is 🟡 partially implemented — schema and gateway hooks exist for `online`, `cash`, `upi`, `wallet`, but no live gateway (Razorpay/Cashfree) is connected yet.
- **No PCI-DSS scope determination, tokenization strategy, or webhook signature verification approach is documented.** These must be defined before connecting a live payment gateway (Roadmap Phase 2).

## 7. Known Security Gaps (Consolidated)

| Gap | Source | Risk |
|---|---|---|
| OTP login is simulated | Source Document §5, §8 | Real users cannot be securely authenticated yet; any "production" testing with real phone numbers would be insecure |
| Migration 010 not guaranteed applied | Source Document §8 | Booking RLS may silently block or (if misconfigured) over-permit inserts |
| No error/security monitoring (Sentry) | Source Document §9, Phase 4 | Security incidents may go undetected in production |
| `admin_users` password policy | `[NOT SPECIFIED IN SOURCE]` | No stated password complexity, MFA, or lockout policy for admin accounts — recommend adding before granting production admin access |
| No stated rate limiting on OTP/login endpoints | `[NOT SPECIFIED IN SOURCE]` | Brute-force/OTP-spam risk once real SMS is connected |
| No documented data retention / deletion policy | `[NOT SPECIFIED IN SOURCE]` | Relevant for KYC PII (Aadhaar/PAN) compliance |

## 8. Recommendations Before Production Launch
1. Execute and verify Migration 010 in every environment; add automated verification.
2. Connect and test a production SMS OTP provider (Twilio/Fast2SMS); disable/remove the demo role switcher login path.
3. Define and document admin password policy + consider MFA for `admin_users`.
4. Define KYC document (Aadhaar/PAN) retention and deletion policy in line with applicable data protection regulation (e.g., India's DPDP Act) — not addressed in Source Document.
5. Add rate limiting on auth endpoints before go-live.
6. Stand up error/security monitoring (Sentry or equivalent) ahead of Phase 4 target.
7. Before connecting a live payment gateway, complete a webhook signature verification design and confirm PCI-DSS scope with the chosen gateway (Razorpay/Cashfree both offer hosted/tokenized flows that can reduce scope).
