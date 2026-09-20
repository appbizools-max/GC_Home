# GC HOME+ — Architecture & Complete Project Structure

> **GC = Genuine and Care**  
> On-Demand Home Cleaning Services Platform (Telangana Geographic Scope: `16.0°N–19.9°N`, `77.2°E–81.3°E`)

---

## 1. High-Level System Architecture

```text
 ┌─────────────────────────────────────────┐      ┌─────────────────────────────────────────┐
 │               User App                  │      │               Admin Panel               │
 │        (React Native / Expo)            │      │          (React + Tailwind CSS)        │
 ├────────────────────┬────────────────────┤      ├─────────────────────────────────────────┤
 │   Customer Mode    │     Maid Mode      │      │  • Live Operations & Dispatch           │
 │ • Service Browsing │ • Online/Offline   │      │  • Partner Approval & KYC Verification  │
 │ • Booking & OTP    │ • 1km–10km Offers  │      │  • Unauthorized Cash Violations Panel   │
 │ • Tracking & Review│ • Completion Proof │      │  • Revenue Analytics & CSV Export       │
 └────────────────────┴────────────────────┘      └─────────────────────────────────────────┘
                                      ▲                    ▲
                                      │                    │
                                      ▼                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 │                            Supabase PostgreSQL Database                                  │
 │ • 16 Idempotent Migration Scripts (000–015)                                              │
 │ • 15 Granular Booking States & Server-Authoritative RPC Functions                        │
 │ • Row Level Security (RLS) & Realtime Subscriptions                                      │
 └──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Module Blueprint

```text
GC_Home/
├── GEMINI.md                            # Primary AI pair programmer safety workflow rules
├── PROJECT_STRUCTURE.md                 # Complete project architectural blueprint & structure reference
├── README.md                            # Project setup & developer quickstart guide
├── GC_Home_Plus_PRD.md                  # Comprehensive Product Requirements Document (PRD)
│
├── admin-panel/                         # Admin Operations Console (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/                  # Admin UI components (Sidebar, Header, Modals)
│   │   ├── config/                      # Supabase configuration client (`supabase.ts`)
│   │   ├── context/                     # `AdminContext.tsx` managing live state & metrics
│   │   ├── pages/
│   │   │   ├── bookings/                # All, Pending, Ongoing, Completed, Cancelled pages
│   │   │   ├── chat/                    # Tri-party chat management console
│   │   │   ├── customers/               # Customer account management
│   │   │   ├── dashboard/               # Operational executive dashboard
│   │   │   ├── login/                   # Admin authentication screen
│   │   │   ├── maid-management/         # Partner approval, KYC document viewer, active/inactive
│   │   │   ├── notifications/           # Push notification sender
│   │   │   ├── operations/              # Dispatch, Live Jobs, Payment Reports, SOS Alerts
│   │   │   ├── reports/                 # Financial analytics & export
│   │   │   ├── revenue/                 # Payout disbursal, commission tracking, coupon management
│   │   │   ├── services/                # Service catalog management
│   │   │   └── settings/                # Platform settings & Telangana bounds config
│   │   ├── types/                       # Admin TypeScript interfaces
│   │   └── utils/                       # `csvExporter.ts` utility
│   ├── index.html                       # Entry HTML template
│   ├── package.json                     # Admin Panel dependencies
│   ├── tsconfig.json                    # Admin TypeScript configuration
│   └── vite.config.ts                   # Vite bundler configuration
│
├── user-app/                            # Customer & Partner Dual Mobile App (React Native / Expo)
│   ├── src/
│   │   ├── assets/                      # Curated high-res images & logos (`ASSETS`)
│   │   ├── components/                  # Common & home components (BottomTabs, GCHeader, ServiceCard)
│   │   ├── config/                      # Supabase configuration client (`supabase.ts`)
│   │   ├── context/                     # `AuthContext.tsx` & `BookingContext.tsx` & `CartContext.tsx`
│   │   ├── screens/
│   │   │   ├── active-job/              # Partner active job console (OTP verification, work proof)
│   │   │   ├── become-maid/             # Partner registration & status screens
│   │   │   ├── booking/                 # Address selection, summary, payment
│   │   │   ├── booking-confirmation/    # Post-booking confirmation screen
│   │   │   ├── booking-tracking/        # Customer live tracking, start OTP display, rating & tip
│   │   │   ├── customer-home/           # Customer home dashboard & service categories
│   │   │   ├── earnings/                # Partner weekly payout & earnings breakdown
│   │   │   ├── help/                    # Customer support & FAQs
│   │   │   ├── login/                   # Phone OTP authentication screen
│   │   │   ├── maid-home/               # Partner home console (Online/Offline, active jobs)
│   │   │   ├── maid-profile/            # Partner profile & documents
│   │   │   ├── my-bookings/             # Customer booking history tabs
│   │   │   ├── my-jobs/                 # Partner assigned/completed job list
│   │   │   ├── notifications/           # User notifications center
│   │   │   ├── offers/                  # Promotional offers screen
│   │   │   ├── otp/                     # 6-Digit OTP verification
│   │   │   ├── profile-setup/           # Customer profile setup & address management
│   │   │   ├── service-details/         # Service description, room pricing & add-ons
│   │   │   ├── services-listing/        # Service search & category filter grid
│   │   │   ├── splash/                  # App splash launch screen
│   │   │   └── user-profile/            # Customer profile & Maid Mode switch card
│   │   ├── services/                    # `authService.ts`, `bookingStateMachine.ts`, `homeService.ts`, `mockData.ts`
│   │   ├── types/                       # TypeScript interfaces (`User`, `MaidProfile`, `CustomerBooking`, etc.)
│   │   └── utils/                       # Image & spatial utility functions (`imageUtils.ts`, `geoUtils.ts`)
│   ├── App.tsx                          # App root navigator & screen switch router
│   ├── app.json                         # Expo configuration
│   ├── package.json                     # Mobile App dependencies
│   └── tsconfig.json                    # User App TypeScript configuration
│
├── migrations/                          # Supabase Database Migrations & Triggers
│   ├── 000_pre_migration_backup.sql
│   ├── 001_phase1_foundation.sql
│   ├── 002_data_migration.sql
│   ├── 003_storage_buckets.sql
│   ├── 004_phase2_core_ops.sql
│   ├── 005_phase3_financials.sql
│   ├── 006_phase4_notifications_config.sql
│   ├── 007_operational_functions.sql
│   ├── 008_create_admin_account.sql
│   ├── 009_consolidate_and_clean_schema.sql
│   ├── 010_seed_and_rls_polish.sql
│   ├── 011_storage_buckets_activation.sql
│   ├── 012_admin_controlled_dispatch_and_tri_party_chat.sql
│   ├── 013_complete_system_tables_and_functions.sql
│   ├── 014_realtime_booking_system_rapido_style.sql
│   ├── 015_telangana_state_restriction.sql
│   └── tests/                           # SQL Smoke & Idempotency Tests
│
├── docs/                                # Unified Project System Documentation
│   ├── API_Documentation.md
│   ├── BRD.md
│   ├── Database_Design_ERD.md
│   ├── Deployment_Environment_Guide.md
│   ├── IMPLEMENTATION_INTEGRATION_TESTING_AUDIT.md
│   ├── Implementation_Technical_Audit.md
│   ├── PRD.md
│   ├── Project_Handover.md
│   ├── README.md
│   ├── Security_RLS_Documentation.md
│   ├── SRS_FRD.md
│   ├── System_Architecture.md
│   ├── TELANGANA_GEOGRAPHIC_RESTRICTION.md
│   ├── Test_Plan_and_Report.md
│   └── UIUX_Design_Specification.md
│
├── scripts/                             # Utility & Automation Scripts
│   └── test-automation/                 # Consolidated test automation scripts (`.mjs`)
│
└── archive/                             # Archived Legacy Files & Redundant Docs
    └── docs/
        └── GC_Home_Plus_Documentation/  # Archived redundant documentation backup
```

---

## 3. Active Server-Authoritative Connections

1. **Database Backend**: Supabase PostgreSQL
   - Connection Client: [`user-app/src/config/supabase.ts`](file:///e:/Home%20Clean/GC_Home/user-app/src/config/supabase.ts) & [`admin-panel/src/config/supabase.ts`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/config/supabase.ts)
2. **State Machine Functions**:
   - `find_eligible_partners`: 1km → 10km progressive radius matching.
   - `verify_booking_otp`: 6-Digit hashed OTP verification with attempt count limits.
   - `is_within_telangana`: Bounding box check (`16.0°N` to `19.9°N`, `77.2°E` to `81.3°E`).
3. **Realtime Channels**:
   - `public:bookings`, `public:maid_profiles`, `public:sos_alerts`, `public:payment_reports`.

---

## 4. Verification & Build Integrity

- **`user-app`**: `npx tsc --noEmit` **PASSED (0 Errors)**.
- **`admin-panel`**: `npx tsc --noEmit` **PASSED (0 Errors)**.
