# System Requirements Specification / Functional Requirements Document (SRS/FRD)
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)

---

## 1. Purpose
Defines functional and non-functional requirements for GC Home+ as implemented, to serve as the testable baseline referenced by `Test_Plan_and_Report.md`.

## 2. Functional Requirements by Workflow

### FR-1: Customer Booking Flow
| ID | Requirement | Status |
|---|---|---|
| FR-1.1 | Customer can browse service categories on home screen | ✅ |
| FR-1.2 | Customer can configure room count and add-ons per service, with dynamic price calculation | ✅ |
| FR-1.3 | Customer can select saved address or enter a new one | ✅ |
| FR-1.4 | Customer can pick a date and time slot | ✅ |
| FR-1.5 | System generates a unique `booking_code` in format `GC-YYYYMMDD-###` | ✅ |
| FR-1.6 | System generates a random 4-digit `start_otp` per booking | ✅ |
| FR-1.7 | System inserts booking into Supabase `bookings` table with status `pending_assignment` | ✅ (🔴 at risk if Migration 010 RLS not applied — see FR-9.1) |
| FR-1.8 | Customer is redirected to confirmation, then live tracking screen | ✅ |

### FR-2: Admin Dispatch & Auto-Assignment
| ID | Requirement | Status |
|---|---|---|
| FR-2.1 | Unassigned bookings surface in Operations Center under "Unassigned" | ✅ |
| FR-2.2 | Admin can manually assign an approved, active maid to a booking | ✅ |
| FR-2.3 | Admin can trigger auto-assignment; system evaluates online maids in the service area and assigns the nearest partner | ✅ |
| FR-2.4 | On assignment, booking status transitions to `assigned` | ✅ |
| FR-2.5 | A row is inserted into `booking_timeline_logs` recording the transition | ✅ |

### FR-3: Maid Partner Execution
| ID | Requirement | Status |
|---|---|---|
| FR-3.1 | Maid sees new job dispatch alert on `MaidHomeScreen` | ✅ |
| FR-3.2 | Maid can accept a job (status → `accepted`) | ✅ |
| FR-3.3 | Maid can mark "On the Way" (status → `en_route`) | ✅ |
| FR-3.4 | Maid must enter customer's 4-digit OTP to begin service (status → `in_progress`) | ✅ |
| FR-3.5 | Maid can upload optional after-photos and mark job complete (status → `completed`) | ✅ |
| FR-3.6 | On completion, a trigger calculates platform commission (reported 15–20%) and credits maid wallet balance | ✅ (automation described; exact trigger logic `[NOT SPECIFIED IN SOURCE]`) |

### FR-4: Post-Service Feedback
| ID | Requirement | Status |
|---|---|---|
| FR-4.1 | Rating card unlocks on the tracking screen after completion | ✅ |
| FR-4.2 | Customer can submit 1–5 star rating with review text | ✅ |
| FR-4.3 | Submission is saved to `ratings` table | ✅ |
| FR-4.4 | `maid_profiles.rating` average updates dynamically | ✅ |

### FR-5: Maid Onboarding / KYC
| ID | Requirement | Status |
|---|---|---|
| FR-5.1 | Prospective maid can apply and upload KYC documents (Aadhaar, PAN) | ✅ |
| FR-5.2 | Documents stored with `document_type`, `file_url`, `status`, `verified_by` in `maid_kyc_documents` | ✅ |
| FR-5.3 | Admin can review and approve/reject KYC in Maid Management console | ✅ |
| FR-5.4 | On approval, maid's app UI switches from customer UI to maid UI | ✅ |

### FR-6: Service & Pricing Management
| ID | Requirement | Status |
|---|---|---|
| FR-6.1 | Admin can manage service catalog (name, category, starting price) | ✅ |
| FR-6.2 | Admin can set commission rate per service | ✅ |
| FR-6.3 | Admin can activate/deactivate a service (`is_active`) | ✅ |

### FR-7: Revenue & Reporting
| ID | Requirement | Status |
|---|---|---|
| FR-7.1 | Admin can view commission & payout tracking (`revenue/`) | ✅ |
| FR-7.2 | Admin can view business intelligence metrics (`analytics/`) | ✅ |
| FR-7.3 | Admin can export financial/audit reports (`reports/`) | ✅ (export format `[NOT SPECIFIED IN SOURCE]`) |

### FR-8: Notifications
| ID | Requirement | Status |
|---|---|---|
| FR-8.1 | Admin can broadcast platform notifications/alerts | ✅ |
| FR-8.2 | Booking/status changes propagate via Supabase Realtime to relevant clients | ✅ |
| FR-8.3 | Push notification delivery via FCM | ❌ Not implemented — schema is payload-ready only; delivery mechanism replaced by Supabase Realtime + in-app queue |

### FR-9: Authentication & Access
| ID | Requirement | Status |
|---|---|---|
| FR-9.1 | Booking inserts must succeed for anonymous/guest customers per RLS policy | 🔴 At risk — depends on Migration 010 being executed in Supabase SQL editor; if not run, anonymous booking inserts are blocked |
| FR-9.2 | Customers/maids authenticate via phone number + OTP | 🟡 Currently demo/simulated OTP, not production SMS |
| FR-9.3 | Super Admin authenticates via email + password (Supabase GoTrue) | ✅ |
| FR-9.4 | Role-based UI gating (`AdminContext`, `AuthContext`) | ✅ |

## 3. Non-Functional Requirements

| ID | Category | Requirement | Status |
|---|---|---|---|
| NFR-1 | Build Integrity | `admin-panel` must compile via `tsc && vite build` with 0 errors | ✅ Reported PASS |
| NFR-2 | Build Integrity | `user-app` must compile via `tsc && vite build` and build on Expo Android | ✅ Reported PASS |
| NFR-3 | Testing | `admin-panel` unit/property tests via Vitest | ✅ Reported 10/10 PASS |
| NFR-4 | Testing | `user-app` test runner present | ❌ Missing — no Jest/Vitest runner configured in `user-app/package.json` |
| NFR-5 | Database Integrity | Migrations must be idempotent and sequential | ✅ Reported (000–010) |
| NFR-6 | Security | Row Level Security enabled on all core tables | ✅ Reported, per-table status in `Security_RLS_Documentation.md` |
| NFR-7 | Performance | Bundle size should stay under recommended thresholds | 🔴 Flagged — Vite bundle >500kB warning on both apps due to monolithic vendor chunking |
| NFR-8 | Observability | Error monitoring across clients | ⏳ Pending — Sentry planned for Phase 4, not yet configured |
| NFR-9 | Realtime | Live data sync for bookings/services/maid status | ✅ Reported — Supabase Realtime publication enabled on `bookings`, `services`, `maid_profiles` |
| NFR-10 | Storage | KYC and job photo access must be permission-controlled | ✅ Reported — signed RLS-governed S3-compatible buckets |
| NFR-11 | Scalability | `[NOT SPECIFIED IN SOURCE]` | No load/throughput targets stated |
| NFR-12 | Accessibility | `[NOT SPECIFIED IN SOURCE]` | No accessibility (WCAG) requirements stated |

## 4. Constraints
- Mobile builds target Android via Expo EAS; iOS build status `[NOT SPECIFIED IN SOURCE]`.
- Backend is Supabase-hosted PostgreSQL 15 exclusively — no stated multi-cloud or self-hosted DB option.
- Real-time features depend on PostgreSQL CDC via WebSockets (Supabase Realtime); requires stable WebSocket connectivity.

## 5. Assumptions
- Assumes Supabase project is provisioned with all 11 migrations (000–010) applied in order.
- Assumes admin accounts are seeded via `008_create_admin_account.sql`.
- `[NOT SPECIFIED IN SOURCE]`: assumed but unconfirmed — production Supabase project region, backup/retention policy.
