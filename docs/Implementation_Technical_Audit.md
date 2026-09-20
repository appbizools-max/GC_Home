# Implementation / Technical Audit
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)
**Method:** This audit consolidates status claims already present in the Source Document into a single implemented/partial/pending/missing/broken/duplicate/deprecated view, per the request. It does not add new findings beyond re-organizing and clearly labeling what the Source Document already states, since no direct code inspection was possible in this session (see `README.md`).

---

## 1. Module-Level Status Matrix

| Module | Status | Evidence |
|---|---|---|
| Admin Web Console (`admin-panel/`) | ✅ **Implemented (100%)** | `tsc && vite build` PASS 0 err; Vitest 10/10 PASS; 11 feature pages confirmed |
| User & Maid Mobile App (`user-app/`) | ✅ **Implemented (100%)** | `tsc && vite build` PASS; Expo Android PASS; 15 screens confirmed |
| PostgreSQL Database (`migrations/`) | ✅ **Implemented (100%)** | Smoke tests PASS; 11 idempotent migrations (000–010) |
| Storage & Media | 🟡 **Partial (90%)** | Buckets operational; exact gaps not itemized in Source Document beyond the 90% figure |
| Realtime Infrastructure | 🟡 **Partial (95%)** | Active on 3 tables (`bookings`, `services`, `maid_profiles`); other tables not covered |
| Payments Layer | 🟡 **Partial (Demo/Mock)** | Schema + gateway hooks ready; no live gateway connected |

## 2. Implemented ✅
- Full customer booking flow (discovery → configuration → checkout → placement → confirmation/tracking)
- Full admin dispatch flow (manual + auto-assign, timeline logging)
- Full maid execution flow (accept → en route → OTP → in progress → complete → automated settlement)
- Post-service rating flow with dynamic average recalculation
- Maid KYC onboarding & admin approval workflow
- Role-based dynamic UI switching (single codebase serves customer and maid roles)
- Service catalog & dynamic pricing management (admin)
- Revenue/commission tracking, analytics, and reporting (admin)
- Notification broadcasts (in-app, via Realtime — not push)
- RLS enabled across all 10 documented tables
- Supabase Storage buckets with signed access policies
- Admin console: 11/11 feature pages built
- Mobile/maid app: 15/15 screens built

## 3. Partially Implemented 🟡
| Item | Detail |
|---|---|
| OTP Authentication | Demo/simulated — not connected to real SMS provider |
| Payments | Schema/hooks exist; no live gateway (Razorpay/Cashfree) connected |
| Storage & Media | 90% — specific remaining 10% not itemized in Source Document |
| Realtime Infrastructure | 95% — coverage limited to 3 of 10 tables |
| Notifications | In-app/Realtime works; FCM push payload schema exists but delivery not implemented |

## 4. Pending / Roadmap ⏳ (Not Yet Built)
| Item | Target Phase |
|---|---|
| Live payment gateway webhook integration (Supabase Edge Functions) | Phase 2 |
| Real SMS OTP provider | Phase 2 |
| Background geolocation tracking during `en_route` | Phase 3 |
| Maps/directions overlay on active job screen | Phase 3 |
| `admin-panel` deployment to Vercel/Cloudflare Pages | Phase 4 |
| Standalone Android APK/AAB via Expo EAS | Phase 4 |
| Sentry error monitoring | Phase 4 |

## 5. Missing ❌ (Expected per Original Baseline, Not Present in Current Architecture)
| Item | Note |
|---|---|
| Firebase Authentication / Firestore | Replaced entirely by Supabase — not "missing" so much as **superseded**; listed here because the *original baseline PRD* expected it |
| Firebase Cloud Messaging (push delivery) | Schema exists but actual push delivery mechanism is not implemented; functionally replaced by Realtime + in-app queue for in-session use only |
| Firebase Storage | Replaced by Supabase Storage |
| `user-app` automated test suite | No Jest/Vitest runner configured — genuinely missing, not superseded |

## 6. Broken / At-Risk 🔴
| Item | Risk |
|---|---|
| Anonymous booking inserts via REST | Blocked by default if Migration 010 has not been run in a given Supabase environment |
| Bundle size | Both apps exceed the 500kB Vite warning threshold due to unconfigured `manualChunks` — not "broken" functionally, but a flagged production-readiness issue |

## 7. Duplicate / Obsolete 🗑️
| Item | Location | Status |
|---|---|---|
| Mock prototype bookings page | `_ARCHIVE/admin-panel/src/pages/bookings/BookingsPage.tsx` | Archived — superseded by the live `admin-panel/src/pages/bookings/` implementation |
| Legacy documentation | `_ARCHIVE/legacy_doc/` | Archived — superseded by current `docs/` |
| Orphaned lockfile | `_ARCHIVE/root/` | Archived — implies a prior dependency-management inconsistency was cleaned up |

The Source Document explicitly marks the entire `_ARCHIVE/` directory as "safe to purge," implying these are confirmed-obsolete, not merely stale.

## 8. Baseline vs. Implemented Discrepancies

| Area | Original PRD Baseline | Actual Implementation | Rationale (as stated) |
|---|---|---|---|
| Backend/DB | Firebase Auth + Firestore | Supabase (PostgreSQL 15) | Relational integrity, ACID transactions for bookings, RLS, PostgREST APIs |
| Push Notifications | Firebase Cloud Messaging | Supabase Realtime + in-app queue | Direct WebSocket updates without third-party vendor lock-in; FCM schema retained but unused |
| File Storage | Firebase Storage | Supabase S3 buckets (`maid-kyc`, `job-photos`) | Native PostgreSQL RLS governing signed file access |
| Role Switching | Replace customer UI with maid UI on approval | Fully implemented in `AuthContext.tsx` | Bottom tabs/home/profile adapt to `role === 'maid' && status === 'approved'` |
| Payments | Razorpay/UPI/COD | Simulated & gateway-ready | Schema supports `payment_method`/`payment_status`/`transactions`; production hooks configured but not live |

## 9. Code-Quality & Scalability Recommendations
(Consolidating Source Document §8/§9 gap analysis into actionable form)

| Area | Recommendation | Priority |
|---|---|---|
| Database/RLS | Enforce Migration 010 as an automated deployment gate, not a manual step | High |
| Auth | Integrate real SMS provider (Twilio/Fast2SMS) before any real-user testing | High |
| Testing | Add Jest/Vitest + `@testing-library/react-native` test runner to `user-app` to reach parity with `admin-panel` | Medium |
| Performance | Configure `build.rollupOptions.output.manualChunks` for React/Supabase/Lucide in both apps' Vite configs | Medium |
| Payments | Complete Razorpay/Cashfree webhook integration via Supabase Edge Functions before revenue collection | High (business-blocking) |
| Observability | Stand up Sentry ahead of Phase 4 target, ideally before Phase 1 zero-day fixes ship to any real users | Medium |
| Housekeeping | Purge `_ARCHIVE/` per the Source Document's own recommendation, after confirming no residual references remain | Low |
| Scalability | `[NOT SPECIFIED IN SOURCE]` — no load testing, connection pooling (e.g., PgBouncer/Supavisor) configuration, or horizontal scaling plan documented; recommend addressing before multi-city rollout |
