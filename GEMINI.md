# SAFE AUDIT → PLAN → IMPLEMENT → TEST WORKFLOW

Follow a **strict staged workflow**. Do not immediately modify the project after discovering an issue.

## PHASE 1 — READ-ONLY PROJECT AUDIT

First inspect the complete project without modifying files, database, UI, configuration, or existing functionality.

Analyze:

* Customer App
* Maid/Partner flows
* Admin Panel
* Supabase database
* Authentication
* Navigation
* Components
* Screens
* Hooks
* Services/API layer
* State management
* Realtime subscriptions
* Notifications
* Payments
* Location
* Chat
* Existing tests
* Configuration/environment files

Create an inventory of all screens, routes, components, database tables and major features.

**RULE:** No code changes during this phase.

---

# PHASE 2 — CURRENT DESIGN SYSTEM AUDIT

Understand the existing UI before making any visual changes.

Identify and document:

* Colors
* Fonts
* Typography scale
* Spacing
* Border radius
* Buttons
* Cards
* Inputs
* Modals
* Bottom navigation
* Headers
* Icons
* Badges
* Toasts
* Skeletons
* Empty states
* Error states

Treat the existing design system as the source of truth.

**Do not redesign it.**

---

# PHASE 3 — SCREEN-BY-SCREEN GAP ANALYSIS

For every screen create:

| Screen | Existing | Missing | Broken | Overlap | UX Issue | Data Issue | Priority |
| ------ | -------- | ------- | ------ | ------- | -------- | ---------- | -------- |

Classify every issue:

* P0 — Critical / blocks core flow
* P1 — High / important functionality
* P2 — Medium / UX improvement
* P3 — Low / polish

Do not implement yet.

---

# PHASE 4 — DEPENDENCY & IMPACT ANALYSIS

Before fixing an issue, determine:

* Which files are affected?
* Which screens depend on them?
* Which components are shared?
* Which Supabase tables are involved?
* Which database relationships are involved?
* Could the change break authentication?
* Could it affect another role?
* Could it affect navigation?
* Could it affect realtime subscriptions?
* Could it affect existing bookings?
* Could it affect RLS/security?
* Could it affect mobile responsiveness?

Identify dependencies before making changes.

---

# PHASE 5 — SAFE IMPLEMENTATION PLAN

Create a prioritized implementation plan.

Example:

| Order | Issue                | Root Cause      | Files                  | DB Impact | Risk | Fix           |
| ----- | -------------------- | --------------- | ---------------------- | --------- | ---- | ------------- |
| 1     | Booking data missing | Incorrect query | Booking screen/service | Yes       | High | Fix query     |
| 2     | Button overlap       | Layout issue    | BookingCard            | No        | Low  | Adjust layout |
| 3     | Missing empty state  | Not implemented | Booking screen         | No        | Low  | Add state     |

Implement **low-risk fixes first**, followed by dependent functionality.

Do not make unrelated changes.

---

# PHASE 6 — BACKUP / SAFE CHECKPOINT

Before significant modifications:

* Preserve the current working state.
* Check Git status.
* Create a checkpoint/commit when Git is available.
* Record the current build state.
* Record important environment/configuration assumptions.
* Do not expose or commit secrets.
* Never overwrite production data unnecessarily.

If a database migration is required:

1. Inspect the existing schema.
2. Check whether the table/column/index already exists.
3. Check dependencies.
4. Make the migration idempotent where possible.
5. Avoid destructive SQL unless explicitly required.
6. Never delete production data simply to fix a UI issue.

---

# PHASE 7 — IMPLEMENT ONE CONTROLLED CHANGE AT A TIME

For each planned issue:

### Step 1

Fix the root cause.

### Step 2

Preserve existing UI/UX.

### Step 3

Implement the smallest safe change.

### Step 4

Run/build/test the affected functionality.

### Step 5

Check related screens.

### Step 6

Check Supabase integration if applicable.

### Step 7

Check for regressions.

Only then move to the next issue.

---

# PHASE 8 — UI IMPLEMENTATION SAFETY

When adding missing UI:

* Reuse existing components.
* Reuse existing spacing.
* Reuse existing colors.
* Reuse existing typography.
* Reuse existing icon library.
* Reuse existing navigation patterns.
* Reuse existing form components.

Do not create a second design system.

Do not replace working components without a reason.

Do not redesign screens simply because another design would look better.

The goal is:

**Improve completeness and usability while preserving the current visual identity.**

---

# PHASE 9 — DATABASE SAFETY

Before changing Supabase:

1. Inspect the actual schema.
2. Verify table names.
3. Verify column names.
4. Verify foreign keys.
5. Verify relationships.
6. Verify existing indexes.
7. Verify RLS policies.
8. Verify triggers/functions.
9. Check existing data compatibility.

Never assume a column exists.

Never generate SQL based only on frontend expectations.

For example, before using:

```sql
is_serviceable
```

verify that the actual `service_areas` table contains that column.

If the schema differs, adapt the application to the real schema or create a safe migration only when necessary.

---

# PHASE 10 — MOCK DATA SAFETY

Do not mix mock/demo data with production data.

Clearly separate:

* Development data
* Test data
* Demo accounts
* Production data

Do not silently delete existing database records.

If test data is required, use clearly identifiable test records.

---

# PHASE 11 — ROLE & SECURITY TEST

After implementing functionality, verify:

### Customer

Can access only authorized customer data.

### Maid

Can access only authorized partner data.

### Admin

Can access authorized administrative functions.

Verify both:

* Frontend permissions
* Supabase RLS/backend permissions

Never rely only on hiding UI buttons.

---

# PHASE 12 — REGRESSION TESTING

After each major implementation group, retest:

### Authentication

Login → Logout → Session → Role routing

### Customer

Home → Service → Address → Booking → Payment → Tracking

### Admin

Login → Booking → Customer → Maid → Assignment → Status

### Maid

Login → Availability → Booking request → Accept → OTP → Start → Complete

### Communication

Chat → Notifications → Realtime updates

### Safety

SOS → Admin alert → Incident tracking

### Account

Profile → Settings → Logout

---

# PHASE 13 — VISUAL REGRESSION CHECK

After implementation inspect every modified screen for:

* Overlapping text
* Overlapping icons
* Incorrect spacing
* Broken alignment
* Clipped content
* Button overflow
* Keyboard issues
* Safe-area issues
* Long text
* Large numbers/prices
* Long addresses
* Small-screen layouts
* Modal overflow
* Scroll problems

Do not consider a feature complete until its UI works correctly at different screen sizes.

---

# PHASE 14 — FAILURE RECOVERY

If an implementation causes a regression:

1. Stop further changes.
2. Identify the change that caused it.
3. Compare with the previous working state.
4. Fix the root cause or revert the unsafe change.
5. Retest the affected flow.
6. Continue only after the application is stable.

Never stack additional changes on top of a known broken state.

---

# PHASE 15 — FINAL END-TO-END TEST

Run the complete business flow:

```text
Customer Login
      ↓
Select Service
      ↓
Select Address
      ↓
Select Date/Time
      ↓
Create Booking
      ↓
Admin Receives Booking
      ↓
Admin Verifies Booking
      ↓
Eligible Maid Detection
      ↓
Maid Assignment
      ↓
Maid Receives Request
      ↓
Maid Accepts
      ↓
Customer Receives Update
      ↓
Maid Reaches Location
      ↓
OTP Verification
      ↓
Service Started
      ↓
Service Completed
      ↓
Payment Confirmation
      ↓
Rating & Review
```

Also test:

```text
Booking Cancellation
Booking Rescheduling
Maid Reassignment
Payment Failure
Network Failure
Location Permission Denied
Notification Failure
Chat
SOS
Logout
Session Expiration
```

---

# PHASE 16 — FINAL AUDIT REPORT

At the end generate:

## A. Completed

Features already working correctly.

## B. Fixed

Existing problems that were corrected.

## C. Newly Implemented

Missing functionality that was added.

## D. Pending

Items that require additional work.

## E. UI/UX Issues

Remaining visual/interaction issues.

## F. Supabase Issues

Schema, query, RLS, realtime or relationship problems.

## G. Security Issues

Authentication, authorization, RLS and data-exposure concerns.

## H. Regression Results

What was tested after implementation.

## I. Production Readiness

Clearly identify what is ready and what still requires work.

---

# NON-NEGOTIABLE SAFETY RULES

**DO NOT:**

* Redesign the application.
* Delete working functionality.
* Delete production data.
* Replace the database schema unnecessarily.
* Invent database columns.
* Invent API responses.
* Hardcode production data.
* Disable RLS to make a feature work.
* Remove authentication checks.
* Modify unrelated screens.
* Make large uncontrolled refactors.
* Change multiple architectural layers without testing.
* Declare success without testing.

**DO:**

* Audit first.
* Understand before modifying.
* Verify the actual schema.
* Identify dependencies.
* Make small controlled changes.
* Preserve the existing design.
* Test after each major change.
* Check regressions.
* Protect existing data.
* Document what changed.
* Clearly identify remaining issues.

## FINAL PRINCIPLE

**AUDIT → UNDERSTAND → PLAN → CHECKPOINT → IMPLEMENT → TEST → REGRESSION TEST → VERIFY → DOCUMENT**

Never jump directly from **AUDIT → MASS IMPLEMENTATION**.
