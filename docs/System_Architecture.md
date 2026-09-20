# System Architecture Document
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)

---

## 1. Architecture Style
Multi-sided marketplace with a monorepo split into two frontend applications (`user-app/`, `admin-panel/`) sharing one Supabase (PostgreSQL 15) backend as the single source of truth, with realtime propagation and S3-compatible object storage.

## 2. High-Level Component Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    GC HOME+ ECOSYSTEM                                   |
+-------------------------------------------------------------+---------------------------+
|               user-app/ (Mobile & Web)                      |  admin-panel/ (Web Only)  |
|  React Native 0.73.6 / Expo SDK 50.0.14                     |  React 18.2.0 / Vite 5.1.6|
|  React Native Web 0.19.10 / Vite 5.1.6                      |  TypeScript 5.2.2         |
|  TypeScript 5.2.2 / Lucide 0.344.0 / AsyncStorage 1.24.0     |  Tailwind 3.4.1           |
|                                                               |  Lucide 0.344.0            |
|                                                               |  Fast-Check 4.10.1 / Vitest 1.6.1 |
+-------------------------------------------------------------+---------------------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                BACKEND & DATA INFRASTRUCTURE                             |
|  Supabase Hosted PostgreSQL 15.x  |  @supabase/supabase-js 2.116.0                        |
|  Auth: Supabase GoTrue (Session, Email/Password; Phone OTP demo-mode)                    |
|  DB Engine: PL/pgSQL stored procedures, RLS triggers                                     |
|  Realtime: PostgreSQL CDC via WebSockets                                                 |
|  Storage: Supabase S3-compatible buckets (public & private KYC)                          |
+-----------------------------------------------------------------------------------------+
```

## 3. Monorepo Structure

```
GC_Home/
├── _ARCHIVE/                    🗑️ Deprecated — safe to purge
│   ├── admin-panel/src/pages/bookings/BookingsPage.tsx   (obsolete mock prototype)
│   ├── legacy_doc/                                        (deprecated docs)
│   └── root/                                              (orphaned lockfile)
├── admin-panel/                 ✅ Operations & Super-Admin Console
│   ├── dist/                    Verified production build
│   ├── src/
│   │   ├── components/          Modals (Create/Cancel/Reschedule/Document), Header, Sidebar
│   │   ├── config/               Supabase client instances (supabase, supabaseAdmin)
│   │   ├── context/               AdminContext (state, role gate, DB syncer)
│   │   ├── pages/                 11 feature pages (see §4)
│   │   ├── services/              Seed data & normalization adapters
│   │   └── types/                 Strict TypeScript models
│   ├── package.json
│   └── vite.config.ts
├── user-app/                    ✅ Unified Customer & Partner mobile/web app
│   ├── dist/                    Verified web production bundle
│   ├── src/
│   │   ├── components/           BottomTabs (role-dynamic), Card primitives
│   │   ├── config/                 Supabase client w/ AsyncStorage persistence
│   │   ├── context/                AuthContext (dual-role routing, cart, bookings)
│   │   ├── screens/                15 screens (see §5)
│   │   ├── services/               Mock data fallback seeds
│   │   └── types/                  Mobile domain interfaces
│   ├── app.json                  Expo config
│   ├── package.json
│   └── vite.config.ts
├── docs/                        Existing consolidated documentation
│   ├── architecture.md
│   ├── database_audit.md
│   ├── PRD.md                    (original Firebase-based baseline)
│   └── TECHNICAL_PRD_PROJECT_DOCUMENT.md  (Source Document for this set)
└── migrations/                  11 sequential idempotent SQL migrations (000–010) + tests/
```

## 4. Admin Console — 11 Feature Pages
`analytics/`, `bookings/` (All/Pending/Ongoing/Completed/Cancelled/Rescheduled), `customers/`, `dashboard/`, `login/`, `maid-management/`, `notifications/`, `operations/`, `reports/`, `revenue/`, `services/`, `settings/`.

## 5. Customer/Maid App — 15 Screens
`active-job/`, `become-maid/`, `booking/`, `booking-confirmation/`, `booking-tracking/`, `customer-home/`, `earnings/`, `login/`, `maid-home/`, `maid-profile/`, `my-bookings/`, `my-jobs/`, `service-details/`, `services-listing/`, `user-profile/`.

## 6. Data Flow Summary

1. **Write path (customer/maid actions):** client → `@supabase/supabase-js` → PostgREST → PostgreSQL (RLS-checked) → trigger fires (e.g., timeline log insert, commission calc) → row committed.
2. **Read/sync path (realtime):** PostgreSQL CDC → Supabase Realtime channel (WebSocket) → subscribed clients (`bookings`, `services`, `maid_profiles` publications) → local state update in `AdminContext` / `AuthContext`.
3. **File path (KYC/job photos):** client uploads directly to Supabase Storage bucket (`maid-kyc`, `job-photos`, `invoices`) → signed RLS policy governs read access → `file_url` stored in relevant table row.

## 7. Cross-Cutting Concerns

| Concern | Mechanism | Status |
|---|---|---|
| State management | `AdminContext` (admin), `AuthContext` (user-app: dual-role routing, cart, bookings) | ✅ |
| Role-based UI switching | `role === 'maid' && status === 'approved'` gate replaces customer UI with maid UI in same app | ✅ |
| Realtime sync | Supabase Realtime publication on 3 tables | ✅ (95% — not all tables covered) |
| Push notifications | Originally FCM (baseline PRD) → replaced by Supabase Realtime + in-app notification queue; FCM payload-ready schema retained but unused | 🟡 |
| Error monitoring | Sentry | ⏳ Planned, Phase 4, not yet implemented |
| Code splitting | `[NOT SPECIFIED IN SOURCE]` — currently absent, flagged as technical debt (see §8) | 🔴 |

## 8. Known Architectural Risks

- **Bundle size**: both apps emit a >500kB Vite bundle-size warning from monolithic vendor chunking. Recommended fix (already identified in Source Document): configure `build.rollupOptions.output.manualChunks` for React, Supabase, and Lucide.
- **RLS dependency on manual migration execution**: Migration 010 must be run manually in the Supabase SQL editor; if skipped, RLS defaults to blocking anonymous/guest booking inserts. This is an architecture-level single point of failure for the core booking flow.
- **user-app has no test runner** configured, unlike `admin-panel`'s Vitest suite — architectural test-coverage asymmetry between the two apps.

## 9. Deployment Target Architecture (Roadmap — not yet live)
- `admin-panel` → Vercel / Cloudflare Pages (⏳ planned)
- `user-app` → Android APK/AAB via Expo EAS (`eas build -p android`) (⏳ planned)
- Payment webhooks → Supabase Edge Functions (⏳ planned, Razorpay/Cashfree)
- SMS OTP → Twilio or Fast2SMS via Supabase Auth config (⏳ planned)

See `Deployment_Environment_Guide.md` for the full phased roadmap.
