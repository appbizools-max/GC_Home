# GC HOME+ — COMPLETE SYSTEM AUDIT & IMPLEMENTATION SPECIFICATION

> **System Overview**: GC HOME+ is an on-demand home cleaning and domestic services platform operating in Telangana. The platform consists of:
> 1. **User App (`user-app`)**: Multi-role mobile application supporting both **Customer** booking/tracking and **Maid Partner** operations/dispatch.
> 2. **Admin Panel (`admin-panel`)**: Operational headquarters for booking dispatch, partner KYC verification, catalog management, and revenue monitoring.
> 3. **Supabase Cloud Backend**: PostgreSQL database, Supabase Storage (`gc-home-assets`), Authentication, and Realtime WebSocket Event Engine.

---

## 1. Complete Architecture & Connected Flow Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                      CUSTOMER JOURNEY                                              |
|                                                                                                    |
|  [Phone OTP Auth]                                                                                  |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Explore Catalog] ────► [Categories] ──► [Services] ──► [Add-ons]                                 |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Select Address] ───► Telangana Cities / Localities (No GPS requirement)                          |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Choose Date & Slot] ──► [Payment Choice: Cash / Online]                                          |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Booking Created] ───► status: "pending_assignment"                                               |
|         │               assignment_status: "unassigned"                                            |
+─────────┼──────────────────────────────────────────────────────────────────────────────────────────+
          │  Realtime Sync (Supabase PostgreSQL Changes)
          ▼
+----------------------------------------------------------------------------------------------------+
|                                        ADMIN CONSOLE                                               |
|                                                                                                    |
|  [Pending Bookings List]                                                                           |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Assign Partner Page] ◄─── Filter: Approved + Verified Photo/Docs + Online + Service Match        |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Admin Dispatches Request] ──► assignment_status: "partner_offered"                               |
|                                 assigned_maid_id: targetPartner.uid                                |
|                                 partner_assignments: status = "pending"                           |
|                                 notifications: "New Job Request" sent to Partner                   |
+─────────┼──────────────────────────────────────────────────────────────────────────────────────────+
          │  Realtime Sync (Supabase PostgreSQL Changes)
          ▼
+----------------------------------------------------------------------------------------------------+
|                                    MAID PARTNER JOURNEY                                            |
|                                                                                                    |
|  [Partner Receives Job Alert] ◄── Notification Sound / Banner (Only assigned maid receives it)     |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Inspect Real Booking Details] ──► Customer Address, Schedule, Add-ons, Duration, Payout         |
|         │                                                                                          |
|    ┌────┴──────────────────────────┐                                                               |
|    ▼                               ▼                                                               |
|  [Decline]                      [Accept Job]                                                       |
|    │                               │                                                               |
|    ▼                               ▼                                                               |
|  assignment_status:              [Select Real ETA] ──► (15 min / 20 min / 30 min / 45 min)         |
|  "unassigned"                      │                                                               |
|  assigned_maid_id: null            ▼                                                               |
|  (Admin re-assigns)              [Accept Confirmed with ETA]                                       |
|                                    │                                                               |
|                                    ▼                                                               |
|                                  bookings.status = "maid_assigned"                                 |
|                                  bookings.partner_eta = "20 min"                                   |
|                                  partner_assignments.status = "accepted"                          |
+─────────┼──────────────────────────────────────────────────────────────────────────────────────────+
          │  Realtime Sync
          ▼
+────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    LIVE SERVICE EXECUTION                                          |
|                                                                                                    |
|  Customer App ◄─────────────── Live ETA & Partner Info ───────────────► Admin Panel                |
|         │                                                                   │                      |
|         ▼                                                                   ▼                      |
|  [Partner En Route] ──► [Partner Arrived] ──► [Work Started] ──► [Completed] ──► [Review & Payout] |
+────────────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Deep Component Audit: Issues Found & Fixes Applied

### A. Partner App (`user-app`)

| Component / File | Issue Discovered | Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`MaidHomeScreen.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/maid-home/MaidHomeScreen.tsx) | Raw customer bookings shown to all online maids | `newJobs` filter checked `b.status === 'pending_assignment'` without checking whether Admin dispatched it to this maid. | Updated `newJobs` filter so only bookings where `assignmentStatus === 'partner_offered'` AND `assignedMaidId === maidId` are displayed. | **RESOLVED** |
| [`MaidHomeScreen.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/maid-home/MaidHomeScreen.tsx) | Assigned maid ID remained attached on decline | Decline query set `assignment_status = 'unassigned'` but left `assigned_maid_id` pointing to the declining maid. | Updated decline handler to set `assigned_maid_id = null, assigned_maid_name = null, assigned_maid_phone = null`. | **RESOLVED** |
| [`AuthContext.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/context/AuthContext.tsx) | Partner app lost registered services | `skills` (string array) took priority over `services_provided` (rich object array), filtering out rich category/sub-service objects. | Prioritized `row.services_provided`, preserving category name, service name, sub-services list, and experience level. | **RESOLVED** |
| [`AuthContext.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/context/AuthContext.tsx) | Postgres `22P02` UUID syntax error | `user.uid` without valid UUID format was queried with `id.eq.${user.uid}`. | Added `isUuid()` regex validation to only include `id.eq` if `user.uid` is a valid UUID, querying phone safely. | **RESOLVED** |
| [`AuthContext.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/context/AuthContext.tsx) | Fake Unsplash image shown if no photo uploaded | Hardcoded Unsplash fallback in `photoUrl` declaration. | Removed Unsplash fallback; returns empty string if no photo was uploaded. | **RESOLVED** |
| [`AuthContext.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/context/AuthContext.tsx) | Fake Partner ID `GC-PARTNER-1001` | Hardcoded fallback string in `maidCode`. | Removed; returns real `row.maid_code` from database. | **RESOLVED** |
| [`AuthContext.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/context/AuthContext.tsx) | Partner A data visible to Partner B after logout | Local storage and auth state were not fully purged on logout. | Added explicit local storage cleanup (`@gc_home_plus_auth_user`, onboarding flags) on `logout()`. | **RESOLVED** |
| [`MaidProfileScreen.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/maid-profile/MaidProfileScreen.tsx) | Fake image, name `Pavani`, and ID `GC-PARTNER-3247` | Hardcoded UI fallbacks. | Replaced with empty avatar placeholder ("Profile Photo Not Added"), real partner name, and real `maidCode`. | **RESOLVED** |
| [`MaidProfileScreen.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/maid-profile/MaidProfileScreen.tsx) | Free-form text input for services in profile | Profile services modal was using arbitrary text inputs instead of the Admin service catalog. | Embedded [`DynamicServiceSelector`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/become-maid/components/DynamicServiceSelector.tsx) so partner selects services from live Admin catalog (`Category → Service → Sub-service`). | **RESOLVED** |
| [`MaidHomeScreen.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/maid-home/MaidHomeScreen.tsx) | Name displayed as `Pavani` | Fallback text was hardcoded to `Pavani`. | Replaced with `{maidProfile?.fullName || user?.name || 'Partner'}`. | **RESOLVED** |
| [`MaidHomeScreen.tsx`](file:///e:/Home%20Clean/GC_Home/user-app/src/screens/maid-home/MaidHomeScreen.tsx) | Missing ETA selection on Accept | Acceptance immediately changed booking status without travel ETA. | Added interactive ETA modal (15 min, 20 min, 30 min, 45 min) storing submitted ETA in `bookings.partner_eta`. | **RESOLVED** |

---

### B. Admin Panel (`admin-panel`)

| Component / File | Issue Discovered | Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`AdminContext.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/context/AdminContext.tsx) | Assignment dispatch did not set assigned maid ID on booking | `sendPartnerAssignmentRequest` only updated `assignment_status` to `'partner_offered'` without saving `assigned_maid_id`. | Added `assigned_maid_id`, `assigned_maid_name`, and `assigned_maid_phone` to the booking update payload. | **RESOLVED** |
| [`AssignMaidPage.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/bookings/AssignMaidPage.tsx) | Available maids not appearing in partner list | `distanceFilter` defaulted to `'10'`, and `(distance > 10 \|\| distance === 0)` eliminated all partners with distance `0` (uncomputed GPS). | Defaulted `distanceFilter` to `'all'`, fixed distance check to `distance > 0 && distance > 10`, added Availability filter, and sorted Online partners first. | **RESOLVED** |
| [`AssignMaidPage.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/bookings/AssignMaidPage.tsx) | Partners falsely excluded if photo URL empty | Strict check `!m.photoUrl` blocked approved maids. | Only exclude partners whose photo was explicitly rejected by Admin (`reupload_required`). | **RESOLVED** |
| [`ApprovedMaidsTab.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/maid-management/ApprovedMaidsTab.tsx) | Mock `MD001` and `|| 30` customers served fallbacks | Hardcoded placeholders in KPI calculations. | Replaced with authentic completed jobs and customers counts, and cleaned up unused `MD001` fallback. | **RESOLVED** |
| [`PendingMaidDetailsTab.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/maid-management/PendingMaidDetailsTab.tsx) | Approval without reviewing submitted documents | Admins could approve applications without verifying uploaded evidence. | Implemented **5-Step Verification Lightbox** with individual status tracking (Step 1-5, Photo, Aadhaar Front/Back, PAN) and strict Approval Guard. | **RESOLVED** |
| [`DispatchPage.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/operations/DispatchPage.tsx) | Direct assignment bypassed partner review and ETA | Assignment action bypassed partner acceptance step and forced status to `maid_assigned`. | Switched to `sendPartnerAssignmentRequest` requiring the partner to inspect booking details and accept with ETA. | **RESOLVED** |
| [`LiveJobsPage.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/operations/LiveJobsPage.tsx) | Mock map pins & hardcoded dummy maids/customer data | Map pins and partner dropdown were hardcoded with fake names (`Pavani`, `Laxmi`, etc.), Hyderabad localities, and fake customer info. | Dynamic data-driven radar map rendered from `filteredJobs`, real approved maids in dropdown, and live booking status stepper. | **RESOLVED** |
| [`ApprovedMaidsTab.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/maid-management/ApprovedMaidsTab.tsx) | Mock booking history rows and hardcoded areas | Profile modal displayed dummy jobs for "Priya Sharma" and "Ravi Kumar" with fake Hyderabad areas. | Connected to real `bookings` assigned to the selected maid and authentic Telangana service areas. | **RESOLVED** |
| [`ActiveMaidsTab.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/maid-management/ActiveMaidsTab.tsx) | Hardcoded `BK250916001` current job card | Selected maid drawer always displayed a hardcoded ongoing job even when idle. | Dynamically checks active bookings for the partner; shows real active job or clean idle/online badge. | **RESOLVED** |
| [`DocumentsManagementTab.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/maid-management/DocumentsManagementTab.tsx) | Hardcoded partner phone and location in drawer | Document details drawer had hardcoded `+91 91234 56789` and `Kondapur, Hyderabad`. | Connected to real `m.phone` and authentic partner city/locality. | **RESOLVED** |
| [`PerformanceTab.tsx`](file:///e:/Home%20Clean/GC_Home/admin-panel/src/pages/maid-management/PerformanceTab.tsx) | Hardcoded dummy customer review | Customer feedback section displayed mock review for "Priya Sharma". | Dynamically queries real reviews from `ratings` or displays clean empty state. | **RESOLVED** |
| Global Admin Scope | Hub filtering hid state-wide Telangana data | Global Hub state (`Hanamkonda`, `Karimnagar`, `Kazipet`) partitioned queries and blocked visibility. | Completely removed Hub filtering and operational data scope from `AdminContext`, Header, Bookings, Dashboard, and Reports. | **RESOLVED** |

---

### C. Database & Migrations

| Migration / Table | Purpose & Changes | Verification |
| :--- | :--- | :--- |
| [`037_add_submitted_at_column.sql`](file:///e:/Home%20Clean/GC_Home/migrations/037_add_submitted_at_column.sql) | Adds `submitted_at` timestamp and stable sorting to `maid_profiles`. | Verified in DB. |
| [`038_verification_system.sql`](file:///e:/Home%20Clean/GC_Home/migrations/038_verification_system.sql) | Adds `verification_status` JSONB column for per-document item status (`pending`, `verified`, `reupload_required`). | Verified in DB. |
| [`039_partner_eta_and_assignment_fixes.sql`](file:///e:/Home%20Clean/GC_Home/migrations/039_partner_eta_and_assignment_fixes.sql) | Adds `partner_eta` column to `bookings` and `partner_assignments` tables. | Verified in DB. |

---

## 3. End-to-End Operational Workflows

### Workflow 1: Maid Registration & Document Verification
```
Step 1: Partner fills 5 steps in user-app
        - Personal Details & Profile Photo
        - Full Address & Preferred Telangana Cities
        - Services & Sub-services selected from Admin Dynamic Catalog
        - Document Uploads: Aadhaar Front, Aadhaar Back, PAN Card
        - Bank Details & UPI ID
Step 2: Partner Submits Registration
        - Database saves record to maid_profiles with status = 'pending'
        - All 5 steps preserved in Supabase
Step 3: Admin Review in PendingMaidDetailsTab
        - Admin clicks each step to review submitted details
        - Admin clicks document thumbnails to open Document Lightbox
        - Admin marks each document: 'verified' OR 'reupload_required' (with reason)
Step 4: If Re-upload Required
        - Notification sent to Maid Partner with specific reason
        - Partner re-uploads document in user-app
        - Admin reviews updated document again
Step 5: Strict Approval Guard
        - Admin can only click 'Approve Partner' when all 5 steps + Photo + Mandatory Documents are 'verified'
        - Once approved, partner becomes job-eligible
```

### Workflow 2: Customer Booking & Admin Assignment
```
Step 1: Customer creates booking in user-app
        - Service, Add-ons, Telangana Address, Scheduled Date & Time
        - Booking created with status = 'pending_assignment'
Step 2: Admin inspects booking in AssignMaidPage
        - Available Partners table lists only approved, verified, and service-matching partners
        - Currently Online partners (isOnline: true) are highlighted and sorted to the top
Step 3: Admin dispatches Assignment Request
        - Admin selects partner and clicks 'Send Assignment Request'
        - assignment_status = 'partner_offered'
        - assigned_maid_id set to selected partner's UID
        - partner_assignments record created with status = 'pending'
        - Notification dispatched to partner
Step 4: Maid Partner Reviews Request
        - Partner reviews full customer address, service, add-ons, date, time slot, duration
        - Partner chooses: Accept OR Decline
Step 5: If Accepted
        - Partner chooses real travel ETA (15 min / 20 min / 30 min / 45 min)
        - booking.status = 'maid_assigned'
        - booking.partner_eta is saved to database
Step 6: Realtime Propagation
        - Customer tracking screen shows partner assigned with real ETA
        - Admin panel reflects partner accepted with real ETA
```

---

## 4. System Verification & Test Status

* **TypeScript Compilation (`user-app`)**: `npx tsc --noEmit` — **0 errors (Exit code 0)**.
* **Production Build (`admin-panel`)**: `npm run build` — **Built in 15.65s (Exit code 0)**.
* **Realtime Subscriptions**: Active on `bookings`, `maid_profiles`, and `partner_assignments`.
* **State Wipe**: Validated on user logout across both customer and partner sessions.
