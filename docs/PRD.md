# Product Requirements Document (PRD)
## GC HOME+ — Customer App, Maid Partner App & Super-Admin Console

**Version:** 2.0-derived (from Source Document v2.0, Sept 2026)
**Status:** As-reported. Cross-reference `BRD.md` for business context and `SRS_FRD.md` for granular functional requirements.

---

## 1. Product Summary

GC Home+ is a three-sided product:
1. **Customer experience** — inside `user-app/` (role = customer)
2. **Maid Partner experience** — same `user-app/` codebase, UI dynamically switches when `role === 'maid' && status === 'approved'`
3. **Super-Admin Console** — separate web-only app, `admin-panel/`

## 2. Platforms & Tech Summary (see `System_Architecture.md` for full detail)

| App | Platforms | Core Stack |
|---|---|---|
| `user-app/` | Mobile (Expo/React Native) + Web (React Native Web via Vite) | React Native 0.73.6, Expo SDK 50.0.14, TypeScript 5.2.2 |
| `admin-panel/` | Web only | React 18.2.0, Vite 5.1.6, TypeScript 5.2.2, Tailwind CSS 3.4.1 |

## 3. User Roles

| Role | Description | Status |
|---|---|---|
| Unauthenticated Guest | Can browse before signing up | ✅ Implemented |
| Customer | Books/tracks/rates services | ✅ Implemented |
| Maid Applicant | Applied via KYC upload, pending approval | ✅ Implemented |
| Verified Maid Partner | Approved; UI fully replaces customer UI | ✅ Implemented |
| Super Admin | Full platform control via `admin_users` table, email/password auth | ✅ Implemented |

## 4. Feature List by Surface

### 4.1 Customer Features (`user-app/`)
- ✅ Service catalog browsing, search, categories, quick book (`customer-home/`)
- ✅ Room counters, add-on selector, dynamic pricing (`service-details/`)
- ✅ Address selection/entry, date & time slot picking, price breakdown (`booking/`)
- ✅ Booking confirmation & tracking shortcut (`booking-confirmation/`)
- ✅ Live booking tracking + 1–5 star rating & review submission (`booking-tracking/`)
- ✅ Bookings list — Upcoming, Ongoing, History (`my-bookings/`)
- ✅ Profile & saved addresses (`user-profile/`)
- ✅ Mobile number / OTP login with a demo switcher (`login/`) — 🟡 OTP is simulated, not production SMS

### 4.2 Maid Partner Features (`user-app/`)
- ✅ Maid onboarding & KYC document upload (`become-maid/`)
- ✅ Dashboard: online/offline toggle, incoming job alerts (`maid-home/`)
- ✅ Job execution: OTP verification, navigation, start/complete (`active-job/`)
- ✅ Assigned & completed jobs list (`my-jobs/`)
- ✅ Earnings dashboard & payout history (`earnings/`)
- ✅ Profile & bank information (`maid-profile/`)

### 4.3 Super-Admin Features (`admin-panel/`)
- ✅ Dashboard — overview & quick actions (`dashboard/`)
- ✅ Bookings — All, Pending, Ongoing, Completed, Cancelled, Rescheduled (`bookings/`)
- ✅ Operations Center — real-time dispatch, manual & auto-assign (`operations/`)
- ✅ Maid Management — fleet & approval console, KYC verification (`maid-management/`)
- ✅ Customers — directory & history (`customers/`)
- ✅ Services — catalog & dynamic pricing manager (`services/`)
- ✅ Revenue — commission & payout tracking (`revenue/`)
- ✅ Analytics — business intelligence & metrics (`analytics/`)
- ✅ Reports — financial export & audit reports (`reports/`)
- ✅ Notifications — platform broadcasts & alerts (`notifications/`)
- ✅ Settings — global commission & operational radius config (`settings/`)
- ✅ Login — Super Admin auth gate, email + password (`login/`)

## 5. Core Workflows

See `SRS_FRD.md` §"Functional Requirements by Workflow" for the fully expanded, testable version of each of these; summarized here:

1. **Customer Booking Flow** (Discovery → Configuration → Checkout → Order Placement → Confirmation/Tracking)
2. **Admin Dispatch & Auto-Assignment Flow** (Detection → Manual/Auto Assignment → State Transition)
3. **Maid Partner Execution Flow** (Dispatch Alert → Accept → En Route → OTP Verify → In Progress → Complete → Settlement)
4. **Post-Service Feedback Flow** (Rating unlock → Star + review submission → `maid_profiles.rating` recalculation)

## 6. Non-Goals / Explicitly Out of Scope for This Release

- Real-time GPS-based maid location tracking — ⏳ Roadmap Phase 3, not yet built
- Live payment capture via Razorpay/Cashfree — 🟡 schema/hooks ready, not connected
- Production SMS delivery — 🟡 demo mode only
- `[NOT SPECIFIED IN SOURCE]`: multi-city/geo-fencing rules beyond "operational radius config" placeholder in Settings

## 7. Dependencies Between Features

- Booking creation depends on Migration 010 RLS policies being applied (🔴 flagged risk — see `Security_RLS_Documentation.md`).
- Maid job execution's OTP-verification step depends on the `start_otp` generated at booking creation — currently app-generated/stored, not SMS-delivered in production.
- Commission/payout automation depends on the `services.commission_rate` and completion trigger described in `Database_Design_ERD.md` §Triggers.

## 8. Open Product Questions
`[NOT SPECIFIED IN SOURCE]` — the following would normally be resolved in a PRD but have no answer in the Source Document:
- Cancellation policy / refund rules
- Maid-to-customer ratio / service area sizing logic beyond "operational radius"
- Surge pricing or peak-time pricing rules
- Multi-language / localization support
