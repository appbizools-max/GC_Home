# API Documentation
## GC HOME+ — Supabase PostgREST / RPC / Auth / Storage / Realtime Surface

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)

**Important scope note:** GC Home+ does not appear to have a custom backend server exposing bespoke REST endpoints. Per the Source Document, both apps talk directly to Supabase via `@supabase/supabase-js` (v2.116.0), which auto-generates a PostgREST API over the schema, plus Supabase's Auth, Storage, and Realtime services. This document describes that API surface **at the level of detail available in the Source Document** — i.e., by table/operation, not exact request/response JSON, since no route list, OpenAPI spec, or Edge Function source was provided. `[NOT SPECIFIED IN SOURCE]` markers indicate where a true API reference would need the actual `config/` client files and any Edge Functions to be complete.

---

## 1. API Architecture

| Layer | Technology | Access Pattern |
|---|---|---|
| Data API | Supabase PostgREST (auto-generated from schema) | `supabase.from('<table>').select/insert/update/delete()` |
| Auth API | Supabase GoTrue | `supabase.auth.*` — session, email/password (admin), phone OTP (customer/maid, demo mode) |
| Realtime API | Supabase Realtime (WebSocket, PostgreSQL CDC) | `supabase.channel(...)` subscriptions on `bookings`, `services`, `maid_profiles` |
| Storage API | Supabase Storage (S3-compatible) | `supabase.storage.from('<bucket>')` — `maid-kyc`, `job-photos`, `invoices` |
| Server-side functions | `[NOT SPECIFIED IN SOURCE]` — Edge Functions referenced only as a *roadmap* item for payment webhooks (Phase 2), not confirmed as currently implemented | ⏳ |

Two Supabase client instances exist in `admin-panel/src/config/`: `supabase` (standard, RLS-scoped) and `supabaseAdmin` (elevated, for admin-only operations) — exact key/permission split `[NOT SPECIFIED IN SOURCE]`.

## 2. Data Endpoints (by table, inferred from RLS policy descriptions)

### `profiles`
| Operation | Caller | Status |
|---|---|---|
| `select` (own row) | Authenticated user | ✅ |
| `update` (own row) | Authenticated user | ✅ |
| `select`/`update` (any row) | Admin | ✅ |

### `maid_profiles`
| Operation | Caller | Status |
|---|---|---|
| `select` (active maids, public fields) | Anyone | ✅ |
| `update` (`is_online` only) | Maid (self) | ✅ |
| Full manage | Admin | ✅ |

### `maid_kyc_documents`
| Operation | Caller | Status |
|---|---|---|
| `insert` (own docs) | Maid applicant | ✅ |
| `select` / verify (`status`, `verified_by`) | Admin | ✅ |

### `services`
| Operation | Caller | Status |
|---|---|---|
| `select` (active services) | Anyone | ✅ |
| Full manage | Admin | ✅ |

### `bookings`
| Operation | Caller | Status |
|---|---|---|
| `insert` | Anyone (public, incl. guest) | 🔴 At risk — requires Migration 010 RLS policy; see `Security_RLS_Documentation.md` |
| `select` / `update` | Involved parties (customer, assigned maid, admin) | ✅ |

### `booking_timeline_logs`
| Operation | Caller | Status |
|---|---|---|
| `select` | Involved parties | ✅ |
| `insert` | System/trigger only (not client-writable) | ✅ |

### `transactions`
| Operation | Caller | Status |
|---|---|---|
| `select` (own) | Maid | ✅ |
| `select` (all) | Admin | ✅ |

### `ratings`
| Operation | Caller | Status |
|---|---|---|
| `select` | Public | ✅ |
| `insert` | Customer (post-completion) | ✅ |

### `app_config`
| Operation | Caller | Status |
|---|---|---|
| `select` | Public | ✅ |
| `update` | Admin | ✅ |

### `admin_users`
| Operation | Caller | Status |
|---|---|---|
| All operations | Admin auth gate only | ✅ |

## 3. Auth Endpoints

| Flow | Method | Status |
|---|---|---|
| Customer/Maid: Phone number entry → OTP | Supabase Auth phone OTP | 🟡 Simulated/demo — not wired to a real SMS provider |
| Super Admin: Email + password | Supabase Auth email/password (GoTrue) | ✅ |
| Session persistence (mobile) | AsyncStorage-backed Supabase session | ✅ |

## 4. Realtime Channels

| Channel / Publication | Subscribers | Status |
|---|---|---|
| `bookings` | Customer app (own bookings), Maid app (assigned jobs), Admin Operations Center | ✅ |
| `services` | Customer app (catalog updates) | ✅ |
| `maid_profiles` | Admin Operations Center (online status, ratings) | ✅ |

Realtime Infrastructure overall status: 🟡 **Completed (95%)** — not all tables are covered by realtime publication (e.g., `ratings`, `transactions` not listed).

## 5. Storage Endpoints

| Bucket | Typical Operation | Caller |
|---|---|---|
| `maid-kyc` | `upload` | Maid applicant |
| `maid-kyc` | signed `download`/`select` | Admin (verification) |
| `job-photos` | `upload` | Maid (job completion) |
| `job-photos` | `select` | Customer/Admin |
| `invoices` | `select` | Customer/Admin |

## 6. Payment Integration (Not Live)

Schema supports `payment_method` (`online`, `cash`, `upi`, `wallet`) and `payment_status` fields, with a `transactions` ledger table. Actual gateway integration (Razorpay/Cashfree) is 🟡 **schema/hook-ready but not connected** — no live payment API calls occur today. Planned: Supabase Edge Function webhook receivers (Roadmap Phase 2).

## 7. Push Notifications (Not Live)

FCM-payload-ready schema exists in a `notifications`-related structure, but delivery is ❌ **not implemented** via FCM — replaced functionally by Supabase Realtime + in-app notification queue for in-session updates. No push-to-device mechanism is currently live.

## 8. Gaps for a Complete API Reference
`[NOT SPECIFIED IN SOURCE]` — the following are required for a fully complete API document but were not in the Source Document and should be pulled from actual code:
- Exact PostgREST query parameters/filters used per screen
- Any custom PL/pgSQL RPC functions exposed via `supabase.rpc(...)` (stored procedures are mentioned generically in §7 of the Source Document but not named)
- Rate limiting configuration
- Error response formats/codes
- API versioning strategy
