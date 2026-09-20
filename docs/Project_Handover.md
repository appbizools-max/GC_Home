# Project Handover Document
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)
**Prepared:** September 19, 2026

---

## 1. Purpose
This document orients an incoming developer, admin, or operator to the current state of GC Home+, what is safe to rely on, what must be fixed before go-live, and where to find the rest of the detail.

## 2. Project State Summary
GC Home+ is a three-app system (`admin-panel/`, `user-app/`, shared Supabase backend) that is **feature-complete at the code level** for its core marketplace loop (booking → dispatch → execution → rating), but **not yet production-launched**. See `Implementation_Technical_Audit.md` for the full breakdown.

**One-line status:** Code is built and passing local tests; go-live is blocked by unrun migration/RLS verification, unconnected SMS and payment providers, and missing production monitoring.

## 3. Repository Map (Quick Reference)
```
GC_Home/
├── admin-panel/     ← Super-admin console (React + Vite + Tailwind)
├── user-app/        ← Customer + Maid app (React Native + Expo)
├── migrations/      ← 11 SQL migrations (000–010) + tests
├── docs/            ← All documentation, including this set
└── _ARCHIVE/        ← Safe to delete (obsolete prototype, legacy docs, orphaned lockfile)
```
Full detail: `System_Architecture.md`.

## 4. Immediate Action Items for Incoming Owner (in priority order)
1. **Confirm Migration 010 has been executed** in every Supabase environment you'll use. If unsure, run it — it's documented as idempotent. See `Security_RLS_Documentation.md` §4.
2. **Do not treat current OTP login as secure** — it's demo/simulated. Connect Twilio or Fast2SMS before any real user touches the app.
3. **Do not expect payments to actually process** — the schema and hooks are ready, but no gateway is live.
4. **Add a test runner to `user-app`** — it currently has none, unlike `admin-panel`'s Vitest suite.
5. Review the full Phase 1–4 roadmap in `Deployment_Environment_Guide.md` before setting a launch date.

## 5. Access & Credentials
`[NOT SPECIFIED IN SOURCE]` — this document set has no visibility into actual Supabase project URLs, API keys, admin account credentials, domain registrars, app store accounts, or CI/CD secrets. **The outgoing team must supply these separately and securely** (e.g., via a password manager vault, not in this document). Recommended minimum handover package:
- Supabase project URL + anon key + service role key (service role key must be rotated post-handover)
- `admin_users` seed account credentials (rotate immediately)
- Any `.env` / environment variable files used by `admin-panel` and `user-app`
- Expo/EAS account access for Android builds
- Domain/DNS and hosting account access (once Vercel/Cloudflare Pages deployment occurs)

## 6. Where to Find Things

| Question | Document |
|---|---|
| What does this product do and for whom? | `BRD.md`, `PRD.md` |
| What exactly is built, screen by screen? | `PRD.md` §4, `UIUX_Design_Specification.md` |
| How is the system architected? | `System_Architecture.md` |
| What's the database schema and what's the biggest DB risk? | `Database_Design_ERD.md` |
| How do the apps talk to the backend? | `API_Documentation.md` |
| What's tested and what isn't? | `Test_Plan_and_Report.md` |
| Is this secure enough to launch? | `Security_RLS_Documentation.md` |
| How do we deploy this, and in what order? | `Deployment_Environment_Guide.md` |
| What's done vs. partial vs. missing vs. broken? | `Implementation_Technical_Audit.md` |

## 7. Known Open Issues (Consolidated)
| # | Issue | Severity | Owner Action Needed |
|---|---|---|---|
| 1 | Migration 010 not guaranteed applied everywhere | High | Verify/run before any booking-flow testing |
| 2 | OTP auth is simulated | High | Connect real SMS provider |
| 3 | Payments not live | High (revenue-blocking) | Connect Razorpay/Cashfree via Edge Functions |
| 4 | `user-app` has no test suite | Medium | Add Vitest/Jest + RN Testing Library |
| 5 | Bundle size >500kB warning, both apps | Medium | Configure `manualChunks` |
| 6 | No error monitoring | Medium | Configure Sentry |
| 7 | No geolocation/maps on active job | Low (roadmap Phase 3) | Build when prioritized |
| 8 | `_ARCHIVE/` cleanup | Low | Purge after confirming no references |

## 8. Contacts / Ownership
`[NOT SPECIFIED IN SOURCE]` — no team roster, RACI chart, or contact list was provided. The incoming owner should request this separately from whoever supplied the Source Document.

## 9. Sign-Off
`[NOT SPECIFIED IN SOURCE]` — no formal handover sign-off, acceptance criteria, or warranty period is defined. Recommend both outgoing and incoming parties formally acknowledge receipt of: (a) full repository access, (b) this documentation set, (c) all credentials listed in §5, and (d) the open issues list in §7, before considering handover complete.
