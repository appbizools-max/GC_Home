# Product Requirements Document (PRD)
## GC Home Plus — On-Demand Cleaning Services App
**GC = Genuine and Care**

---

## 1. Overview

GC Home Plus is an on-demand home cleaning services marketplace app, similar in concept to Urban Company. Customers browse and book cleaning services (Basic Clean, Medium Clean, Deep Clean, and future services), and verified maids/service providers fulfill those bookings. The platform has three surfaces:

1. **User App** (React Native — Web + Mobile) — used by both **Customers** and **Maids**. A single account starts as a Customer; if that user registers as a maid, the app switches that account's UI to a **Maid-only UI**.
2. **Admin Panel** (React + Tailwind CSS, Web) — used by the platform owner/staff to manage services, bookings, maid approvals, assignment, and revenue.
3. **Backend** — Firebase Authentication + Firestore (database), Firebase Cloud Messaging (notifications), Firebase Storage (photos/documents).

**Tech Stack**
| Layer | Technology |
|---|---|
| Frontend (User App) | React Native (Web + Mobile) |
| Frontend (Admin Panel) | React + Tailwind CSS |
| Auth | Firebase Authentication (Mobile OTP) |
| Database | Firebase Firestore |
| File/Image Storage | Firebase Storage |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Styling | Tailwind CSS |

---

## 2. Goals

- Let customers easily browse cleaning services and book an appointment with a date/time slot.
- Let the admin fully control which services are shown, their pricing, and manage the whole booking lifecycle.
- Let maids register in-app, get admin-verified, then receive/accept/reject job assignments.
- Give both admin and maids visibility into earnings/revenue.
- Ship a clean, simple, mobile-first UI.

---

## 3. User Roles

| Role | Description |
|---|---|
| **Customer** | Browses services, books appointments, pays, tracks status, rates maid. |
| **Maid (Service Provider)** | Registers via the same app, gets admin-approved, receives job assignments, accepts/rejects, completes jobs, views earnings. |
| **Admin** | Manages services, bookings, maid approvals, manual/auto assignment, revenue reporting, and platform settings. |

> **Important rule:** Any customer account can apply to become a maid from within the User App. Once that application is **approved by Admin**, that account's app experience switches entirely to the **Maid UI** — the customer-facing screens (service browsing/booking) are no longer shown to that account.

---

## 4. Screen-by-Screen Flow (Login → End)

### 4.1 Common — Authentication
- **Splash Screen** → app logo, loading check (is user logged in / role check).
- **Login / Signup Screen**
  - Mobile number input → OTP sent via Firebase Auth.
  - OTP verification screen (auto-read where supported).
  - New user → basic profile setup (Name, Email optional, Profile photo optional).
  - Existing user → routed based on role:
    - No maid profile → **Customer Home**
    - Maid profile exists & approved → **Maid Home**
    - Maid profile exists & pending/rejected → **Maid Status Screen**

---

### 4.2 Customer Flow

1. **Customer Home Screen**
   - List/grid of active service categories (as configured by Admin): Basic Clean, Medium Clean, Deep Clean, etc.
   - Each service card: icon/image, name, short description, starting price.
   - Search bar, banner/offers section (optional future).
   - Bottom navigation: Home, Bookings, "Become a Maid", Profile.

2. **Service Details Screen**
   - Full description of selected service.
   - Options/variants if applicable (e.g., number of rooms, home size).
   - Price estimate calculation.
   - "Book Now" button.

3. **Booking Screen**
   - Select address (saved addresses or add new with map pin/manual entry).
   - Select date and time slot.
   - Add special instructions (optional).
   - Price summary (service cost + any advance amount).
   - Payment method selection (Razorpay/UPI/Card) or Pay-on-completion (per admin config).
   - Confirm Booking button.

4. **Booking Confirmation Screen**
   - Booking ID, summary, status = "Pending Assignment."
   - Notification sent to Admin.

5. **My Bookings Screen**
   - Tabs: Upcoming, Ongoing, Completed, Cancelled.
   - Each booking shows status progression:
     `Pending Assignment → Maid Assigned → Maid Accepted → In Progress → Completed`
   - Option to cancel/reschedule (before assignment or per policy).

6. **Booking Detail / Tracking Screen**
   - Assigned maid's name, photo, rating (contact number masked).
   - Live status updates.
   - Chat or call button (masked calling, optional future).
   - After completion: rating & review screen, invoice/receipt download.

7. **"Become a Maid" Screen (entry point inside Customer UI)**
   - Short explanation + "Register as Maid" button → opens **Maid Registration Flow** (Section 4.3).
   - After submission, this account is flagged `maidApplication: pending` and shows a **Maid Status Screen** on next login until Admin approves/rejects.

8. **Profile Screen**
   - Edit name/photo/email, manage addresses, saved payment methods, logout, help/support, "Become a Maid" shortcut.

---

### 4.3 Maid Registration Flow (inside the same User App)

1. **Registration Form Screen**
   - Full Name, Photo/Selfie upload, Address, ID proof document upload, Emergency contact, Bank account details (for payouts), Service area/radius selection (location-based), Availability (working hours/days).
   - A health & safety declaration section as required for a chemical-based cleaning role (per Admin's configured form fields) — collected and stored securely, visible only to Admin for verification purposes.
   - Submit for review.

2. **Maid Status Screen** (shown after submission, before approval)
   - "Application Under Review" state.
   - If **Rejected**: shows reason (entered by Admin) + option to re-submit/edit and resend.
   - If **Approved**: role switches → app now shows **Maid UI only** on next load.

---

### 4.4 Maid Flow (post-approval — replaces Customer UI entirely)

1. **Maid Home / Dashboard Screen**
   - Online/Offline availability toggle.
   - Today's assigned jobs summary.
   - Quick stats: jobs completed this week, earnings this week.

2. **Job Requests Screen**
   - Incoming job assignment appears here (from Admin — manual or automatic based on maid's location/service area).
   - Job card: service type, customer area/locality, date/time, price/payout for this job.
   - **Accept** / **Reject** buttons with a response timer.
   - If maid **Rejects** (or timer expires) → Admin is notified and can reassign to the next maid.

3. **Job Detail / Active Job Screen**
   - Customer address (map/navigation link), date/time, service instructions.
   - "Start Job" (e.g., OTP-based start with customer, optional) → "Mark In Progress."
   - Optional before/after photo upload for the job.
   - "Mark Completed" button → moves job to completed, triggers customer rating request.

4. **My Jobs Screen**
   - Tabs: Assigned, In Progress, Completed, Rejected/Missed.

5. **Earnings Screen**
   - Daily / Weekly / Monthly earnings breakdown.
   - Per-job payout list, total jobs completed, pending payout amount, payout history.

6. **Maid Profile Screen**
   - View/edit personal details (may require Admin re-approval for certain fields), documents status, service area/radius setting, availability schedule, ratings received, logout.

---

### 4.5 Admin Panel Flow

1. **Admin Login Screen**
   - Email/Password or Mobile OTP login (restricted admin accounts).

2. **Admin Dashboard**
   - Key metrics: total bookings today, active maids, pending maid approvals, total revenue (today/week/month), pending assignments needing action.

3. **Service Management Screen**
   - List of all services (Basic Clean, Medium Clean, Deep Clean, + any future service).
   - **Add Service** (name, description, image, price, active/inactive toggle).
   - **Edit Service** / **Delete Service**.
   - Enable/disable a service instantly from the list.

4. **Bookings Management Screen**
   - List/table of all bookings with filters (status, date, service type, area).
   - Booking Detail view: customer info, service, address, requested date/time, payment status.
   - **Assign Maid** action:
     - **Manual assignment**: Admin picks from a list of eligible maids (filtered by service area/location and availability).
     - **Automatic assignment**: system suggests/sends to the nearest available maid first; if rejected, moves to the next nearest maid automatically.
   - Reassign / Cancel / Refund actions.

5. **Maid Management Screen**
   - **Pending Approvals** tab: view submitted maid registration (details + documents), **Approve** or **Reject** (with reason).
   - **Active Maids** list: profile, service area, current status (online/offline), ratings, job history, suspend/deactivate option.
   - Ability to view/download uploaded documents for verification.

6. **Revenue / Reports Screen**
   - Total revenue over selectable date ranges.
   - Revenue by service type.
   - Per-maid earnings/payout report (how much each maid has earned, pending payouts).
   - Export report (CSV) — optional future.

7. **Notifications / Settings Screen**
   - Manage manual notification sending to maids (as an alternative to automatic).
   - App configuration: service areas, pricing rules, payment gateway settings.

---

## 5. Core Data Model (Firestore Collections — high level)

- `users` — uid, name, phone, email, role (`customer` / `maid` / `admin`), createdAt.
- `maidProfiles` — uid (linked to users), registration form fields, documents, serviceArea/radius, status (`pending`/`approved`/`rejected`), availability, rating.
- `services` — serviceId, name, description, image, price, isActive.
- `bookings` — bookingId, customerId, serviceId, address, dateTime, status, assignedMaidId, paymentStatus, amount.
- `jobAssignments` — bookingId, maidId, status (`sent`/`accepted`/`rejected`/`completed`), timestamps.
- `payments` — bookingId, amount, method, status, gatewayRef.
- `earnings` — maidId, bookingId, amount, date, payoutStatus.
- `ratings` — bookingId, customerId, maidId, rating, review.

---

## 6. Key Business Rules

1. A user starts as a Customer; applying and getting **approved** as a maid switches that account fully to the **Maid UI**.
2. Only Admin can add, edit, or delete services shown to customers.
3. Every booking must go through Admin (or the automatic engine) for maid assignment — customers never pick a maid directly.
4. A maid must **Accept** an assigned job before it becomes active; **Reject** (or timeout) triggers reassignment to the next eligible maid.
5. Maid registration requires Admin approval before the maid can go live and receive jobs.
6. Earnings/revenue are tracked per booking and rolled up per maid and platform-wide for Admin reporting.

---

## 7. Non-Functional Requirements

- Simple, clean, mobile-first UI (light green #BBE9D2 + white theme).
- Role-based access control (Customer / Maid / Admin) enforced in Firestore security rules.
- Scalable to handle growing daily booking volume.
- Secure storage of sensitive maid documents (Firebase Storage with restricted access rules — visible to Admin only).
- Push notifications (FCM) for: booking confirmation, maid assignment, job accept/reject, job status changes, maid approval/rejection.

---

## 8. Future / Phase 2 Considerations
- Additional service categories beyond cleaning.
- In-app chat and masked calling between customer and maid.
- Coupons/offers and referral system.
- Automated payouts to maids.
- Multi-language support.

---

*End of PRD — Login through final booking/earnings flow covered above.*
