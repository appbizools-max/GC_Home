# Business Requirements Document (BRD)
## GC HOME+ — On-Demand Cleaning Services Ecosystem

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)
**Status:** As-reported from Source Document — not independently verified against a live business case, budget, or stakeholder sign-off records, none of which were provided.

---

## 1. Business Overview

**GC Home+** ("GC" = *Genuine and Care*) is a multi-sided on-demand domestic cleaning services marketplace connecting urban households with verified maid partners, coordinated through an internal operations and financial console. It is modeled on established on-demand service marketplace patterns (e.g., ride-hailing/gig-economy dispatch models applied to home cleaning).

## 2. Business Objectives

Derived from the platform's implemented capabilities, the inferred business objectives are:

- Provide a self-serve booking channel for households to order cleaning services on demand or by schedule.
- Build a verified, KYC-checked maid partner network with an approval workflow, reducing trust/safety risk.
- Centralize dispatch, KYC verification, pricing, and financial settlement in a single super-admin console.
- Generate platform revenue via commission on each completed booking (`commission_rate` per service, `commission_amount` per booking).
- Support multiple payment modes (`online`, `cash`, `upi`, `wallet`) to match regional payment behavior.

`[NOT SPECIFIED IN SOURCE]`: Specific revenue targets, target market size, launch geography, funding stage, and competitive positioning are not stated in the Source Document.

## 3. Stakeholders

| Stakeholder | Role / Interest |
|---|---|
| Customers (Households) | End users who browse, book, track, and rate cleaning services |
| Maid Partners | Gig workers who apply via KYC, accept jobs, execute service, earn payouts |
| Super Admin / Operations Team | Internal staff dispatching bookings, verifying KYC, managing pricing/commission, monitoring revenue |
| Platform Owner/Operator | Owns commission revenue model and overall platform |

`[NOT SPECIFIED IN SOURCE]`: Named individuals, org chart, or external investors/partners are not identified in the Source Document.

## 4. Scope

### 4.1 In Scope (as implemented — see Implementation/Technical Audit for detail)
- Customer mobile/web app: service discovery, booking, live tracking, ratings
- Maid partner mobile/web app (same codebase, role-switched UI): onboarding/KYC, job acceptance, OTP-verified job execution, earnings
- Super-admin web console: dispatch, KYC approval, service/pricing management, revenue/commission tracking, reporting, notifications, settings
- Supabase-backed PostgreSQL data layer with Row Level Security (RLS), realtime updates, and S3-compatible storage for KYC docs and job photos

### 4.2 Out of Scope / Not Yet Delivered (as of Source Document date)
- Production SMS OTP delivery (currently demo/simulated) 🟡
- Live payment gateway processing (schema and hooks exist; gateway itself is "Gateway-Ready," not connected) 🟡
- Background geolocation / live GPS tracking during `en_route` status ⏳ (Roadmap Phase 3)
- Maps/directions overlay (Google Maps/Mapbox) ⏳ (Roadmap Phase 3)
- Production error monitoring (Sentry) ⏳ (Roadmap Phase 4)
- Automated CI/CD deployment pipeline `[NOT SPECIFIED IN SOURCE]`

## 5. Business Workflows (Summary)

1. **Customer Booking** — discover services → configure → checkout → order placed (`pending_assignment`) → confirmation/tracking.
2. **Admin Dispatch** — unassigned booking appears in Operations Center → manual or auto-assign to nearest eligible online maid → status → `assigned`.
3. **Maid Execution** — accept → en route → OTP-verified arrival → in progress → complete (with optional photos) → automated commission split and maid wallet credit.
4. **Post-Service Feedback** — customer rates 1–5 stars + review → feeds `maid_profiles.rating` average.

(Full technical detail in `PRD.md` §6 and `SRS_FRD.md`.)

## 6. Revenue Model

- Commission-based: each `service` carries a `commission_rate`; each `booking` records `commission_amount` and `maid_payout`, split automatically on completion (reported range: 15–20%).
- Multiple payment method support tracked via `payment_method` / `payment_status` fields, though gateway integration is not yet live (see §4.2).

## 7. Success Criteria

`[NOT SPECIFIED IN SOURCE]` — no explicit KPIs, adoption targets, or acceptance criteria are defined in the Source Document. Recommended (not yet agreed) candidates, for stakeholder validation:
- % of bookings auto-assigned vs. manually dispatched
- Average time from booking creation to maid assignment
- Booking completion rate / cancellation rate
- Maid partner KYC approval turnaround time
- Customer rating average platform-wide

## 8. Known Business-Level Risks

| Risk | Source | Impact |
|---|---|---|
| Anonymous/guest bookings may be blocked if Migration 010 is not run | Source Document §8, High Priority | Customers cannot place bookings via REST — direct revenue blocker |
| OTP login is simulated, not production SMS | Source Document §8 | Cannot onboard real users until SMS gateway is wired up |
| Payments are simulated/demo mode | Source Document §5, §7 | No real revenue collection is currently possible |
| No production error monitoring | Source Document §9, Phase 4 (not yet reached) | Operational blind spots post-launch |

## 9. Historical Note — Baseline vs. Implementation Divergence

The original PRD baseline (`docs/PRD.md` in repo) specified Firebase Authentication, Firestore, Firebase Cloud Messaging, and Firebase Storage. The implemented system uses Supabase (PostgreSQL 15) for all of these instead, for stated architectural reasons (relational integrity/ACID transactions, RLS, native Postgres realtime, no FCM vendor lock-in). See `Implementation_Technical_Audit.md` §"Baseline vs Implemented Discrepancies" for the full comparison table.
