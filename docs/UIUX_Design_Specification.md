# UI/UX Design Specification
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)
**Note:** The Source Document does not include a design system, color palette, typography scale, wireframes, or Figma references. This document describes **screen inventory, navigation structure, and role-based UI behavior only**, as those are what's actually stated. Visual design specifics are flagged `[NOT SPECIFIED IN SOURCE]`.

---

## 1. Design System
`[NOT SPECIFIED IN SOURCE]` — no color tokens, typography, spacing scale, or component library beyond the confirmed use of **Lucide Icons 0.344.0** (aliased `lucide-react` for admin, `lucide-react-native`/web for user-app) and **Tailwind CSS 3.4.1** (admin-panel only) are documented. `user-app` styling approach beyond React Native StyleSheet conventions is not specified.

## 2. Navigation Architecture

### 2.1 `user-app/` — Unified Customer/Maid App
- Bottom tab navigation via a shared `BottomTabs` component that **dynamically changes tab set based on role** (`role === 'maid' && status === 'approved'` → maid tabs; otherwise → customer tabs). ✅
- Single login entry point (`login/`) with a demo role switcher for testing. ✅ (🟡 demo/testing convenience — should be reviewed before production)

### 2.2 `admin-panel/` — Super-Admin Console
- Sidebar + Header layout (`components/Header`, `components/Sidebar`)
- 11 top-level pages accessed via sidebar routing
- Modal-driven actions layered on top of pages: Create Booking, Cancel Booking, Reschedule Booking, Document (KYC) review modals

## 3. Screen Inventory — Customer/Maid App (15 screens)

| Screen | Role | Purpose |
|---|---|---|
| `login/` | Both | Phone/OTP auth + demo role switcher |
| `customer-home/` | Customer | Service catalog, search, categories, quick book |
| `service-details/` | Customer | Room counters, add-ons, pricing |
| `services-listing/` | Customer | Full category catalog |
| `booking/` | Customer | Address, time slot, price breakdown |
| `booking-confirmation/` | Customer | Booking summary, tracking shortcut |
| `booking-tracking/` | Customer | Live tracking + rating submission |
| `my-bookings/` | Customer | Upcoming / Ongoing / History |
| `user-profile/` | Customer | Profile & saved addresses |
| `become-maid/` | Applicant | Onboarding & KYC upload |
| `maid-home/` | Maid | Online toggle, incoming job alerts |
| `active-job/` | Maid | OTP verification, navigation, start/complete |
| `my-jobs/` | Maid | Assigned & completed jobs |
| `earnings/` | Maid | Financial dashboard, payout history |
| `maid-profile/` | Maid | Profile & bank information |

## 4. Screen Inventory — Admin Console (11 pages)

| Page | Purpose |
|---|---|
| `login/` | Super admin auth gate |
| `dashboard/` | Overview & quick actions |
| `operations/` | Real-time dispatch center |
| `bookings/` | All / Pending / Ongoing / Completed / Cancelled / Rescheduled tabs |
| `maid-management/` | Fleet & approval console, KYC verification |
| `customers/` | Directory & history |
| `services/` | Catalog & dynamic pricing manager |
| `revenue/` | Commission & payout tracking |
| `analytics/` | Business intelligence & metrics |
| `reports/` | Financial export & audit reports |
| `notifications/` | Platform broadcasts & alerts |
| `settings/` | Global commission & operational radius config |

## 5. Key UX Flows (Screen-Level)

1. **Booking:** `customer-home` → `service-details` (or `services-listing`) → `booking` → `booking-confirmation` → `booking-tracking`
2. **Maid onboarding:** `login` → `become-maid` (KYC upload) → *(admin approval, out of app)* → role auto-switches → `maid-home`
3. **Job execution:** `maid-home` (alert) → `active-job` (accept → en route → OTP → in progress → complete) → `my-jobs` / `earnings`
4. **Admin dispatch:** `operations` (unassigned queue) → manual assign or auto-assign modal → booking moves through `bookings` status tabs

## 6. Cross-Platform Consistency
- `user-app` is built once with React Native + React Native Web, so customer/maid screens render consistently across mobile and web via the same component tree. ✅
- `admin-panel` is web-only by design (no mobile admin app). ✅

## 7. Identified UI/UX Gaps & Recommendations
Since no design system was provided, the following are **process recommendations**, not confirmed defects:
- Formalize a design system (color tokens, typography scale, spacing) shared across `admin-panel` (Tailwind config) and `user-app` (RN StyleSheet/theme) to guarantee visual consistency — currently `[NOT SPECIFIED IN SOURCE]` whether one exists.
- Audit the demo role switcher on the login screen — a testing convenience like this should be feature-flagged out of production builds.
- Add explicit empty-state, loading-state, and error-state designs for realtime-dependent screens (`operations/`, `booking-tracking/`, `maid-home/`) since these are especially sensitive to connectivity issues over WebSocket.
- No accessibility (screen reader labels, color contrast, tap target sizing) requirements are documented — recommend a WCAG 2.1 AA pass before production launch.
- `[NOT SPECIFIED IN SOURCE]`: usability testing results, user research, or persona documentation.
