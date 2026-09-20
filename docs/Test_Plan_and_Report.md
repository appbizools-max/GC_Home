# Test Plan & Test Report
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)

---

## PART A — Test Report (As-Reported Results)

| Module | Test Type | Result | Detail |
|---|---|---|---|
| `admin-panel` | Type check | ✅ PASS | `tsc` — 0 errors |
| `admin-panel` | Build | ✅ PASS | `vite build` |
| `admin-panel` | Unit / property tests | ✅ 10/10 PASS | Vitest 1.6.1 + Fast-Check 4.10.1 (property-based testing) |
| `user-app` | Type check | ✅ PASS | `tsc` |
| `user-app` | Build | ✅ PASS | `vite build` |
| `user-app` | Native build | ✅ PASS | Expo Android build |
| `user-app` | Unit tests | ❌ Missing | No Jest/Vitest test runner configured in `package.json` |
| `migrations/` | Smoke tests | ✅ PASS | Located in `migrations/tests/` |

**`[NOT SPECIFIED IN SOURCE]`:** individual test case names/descriptions, code coverage percentages, integration test results, end-to-end test results, manual QA sign-off records, device/browser compatibility matrix, and performance/load test results are not provided in the Source Document. The "10/10 PASS" and "Smoke tests PASS" figures are repeated as reported and have not been independently re-run or verified in this session.

## PART B — Recommended Test Plan (Forward-Looking)

The following is a **recommended** test plan to close the gaps above — not a description of existing tests.

### B.1 Test Levels & Ownership

| Level | Scope | Tooling (existing/recommended) |
|---|---|---|
| Unit | Business logic, pricing calculators, RLS-adjacent helper functions | Vitest (admin-panel, existing); add Vitest or Jest + `@testing-library/react-native` to `user-app` |
| Property-based | Pricing/commission math edge cases | Fast-Check (admin-panel, existing) — extend to `user-app` pricing logic |
| Integration | Supabase read/write against a test project, RLS policy verification | Recommend: Supabase local dev stack + `migrations/tests/` extension |
| E2E | Full booking → dispatch → execution → rating flow across both apps | Recommend: Playwright (web builds) + Detox or Maestro (Expo/Android) |
| Manual QA / UAT | Role-based UI switching, KYC approval flow, OTP flow | Recommend: structured test script per user role |

### B.2 Priority Test Scenarios (mapped to FR IDs in `SRS_FRD.md`)

| Priority | Scenario | Related FR |
|---|---|---|
| P0 | Anonymous customer can create a booking end-to-end (validates Migration 010 RLS) | FR-1.7, FR-9.1 |
| P0 | Maid OTP entry correctly transitions booking to `in_progress` and rejects wrong OTP | FR-3.4 |
| P0 | Commission split & wallet credit correctness on job completion | FR-3.6 |
| P1 | Auto-assign selects nearest *online* maid within operational radius, excludes offline/inactive maids | FR-2.3 |
| P1 | Role UI switch triggers correctly and only after admin KYC approval (not before) | FR-5.4 |
| P1 | Rating submission updates `maid_profiles.rating` average correctly (including first-rating and rounding edge cases) | FR-4.4 |
| P2 | RLS: a customer cannot read another customer's booking; a maid cannot read another maid's payout | FR-9 family |
| P2 | Realtime: booking status change propagates to all three surfaces (customer, maid, admin) within acceptable latency | NFR-9 |

### B.3 Non-Functional Test Recommendations
- **Load/performance:** No current benchmarks exist (`NFR-11` gap). Recommend load-testing the booking-insert and dispatch-assign paths under concurrent load before launch.
- **Security:** Full RLS policy review per table (see `Security_RLS_Documentation.md`) — automate as CI-run integration tests against a scratch Supabase project.
- **Bundle size:** Track Vite bundle size in CI to prevent regression beyond the already-flagged >500kB warning.

### B.4 Test Environment Requirements
`[NOT SPECIFIED IN SOURCE]` — no dedicated staging Supabase project, environment variable strategy, or seed/reset scripts beyond migration files are documented. Recommend provisioning a dedicated staging Supabase project mirroring production migrations for safe test execution.

## PART C — Sign-Off Status
No formal QA/UAT sign-off records exist in the Source Document. **This project should not be considered production-tested** beyond the build/type-check/unit-test results in Part A.
