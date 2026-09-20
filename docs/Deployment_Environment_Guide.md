# Deployment & Environment Guide
## GC HOME+

**Version:** 1.0 (derived from Source Document v2.0, Sept 2026)

---

## 1. Current Deployment Status
No production deployment has occurred yet per the Source Document — the roadmap below (§4) is entirely **forward-looking (⏳ Pending)**. Builds are verified locally/CI (`tsc && vite build`, Expo Android build) but not yet shipped to a live environment.

## 2. Environments
`[NOT SPECIFIED IN SOURCE]` — the Source Document does not name specific environments (dev/staging/prod), environment variable files, or Supabase project IDs. The guidance below is structured around what *should* exist, flagged as recommendations, not confirmed configuration.

| Environment | Purpose | Status |
|---|---|---|
| Local development | `vite dev` for both apps, Expo dev client for mobile | Assumed in use (build commands confirm a working local toolchain) |
| Staging | Pre-production Supabase project + hosted frontend | ⏳ Not confirmed to exist |
| Production | Live Supabase project + Vercel/Cloudflare Pages + Android app | ⏳ Not yet deployed |

## 3. Build Commands (Confirmed)

| App | Command | Result |
|---|---|---|
| `admin-panel` | `tsc && vite build` | ✅ PASS, 0 errors |
| `admin-panel` | `vitest` | ✅ 10/10 PASS |
| `user-app` | `tsc && vite build` | ✅ PASS (web bundle) |
| `user-app` | Expo Android build | ✅ PASS |

`[NOT SPECIFIED IN SOURCE]`: exact npm scripts, Node version pin, package manager (npm/yarn/pnpm), or lockfile in use (an "orphaned lockfile" is noted as archived, implying a lockfile inconsistency was previously present).

## 4. Production Readiness Roadmap (As Documented)

### Phase 1 — Zero-Day Hardening (Immediate)
- Execute `010_seed_and_rls_polish.sql` in the Supabase Dashboard SQL editor.
- Verify live booking creation from the user app reaches Supabase REST successfully end-to-end.

### Phase 2 — Payment & SMS Gateway Integration (Week 1–2)
- Connect Razorpay / Cashfree webhook to Supabase Edge Functions.
- Enable a real SMS OTP provider in Supabase Auth configuration.

### Phase 3 — Realtime Location & Geofencing (Week 3–4)
- Enable background geolocation tracking during the `en_route` booking status.
- Add a Google Maps / Mapbox directions overlay to the active job screen.

### Phase 4 — Production Deployment & Observability (Week 5)
- Deploy `admin-panel` to Vercel or Cloudflare Pages.
- Build a standalone Android APK/AAB via Expo EAS (`eas build -p android`).
- Configure Sentry error monitoring across both client applications.

## 5. Deployment Prerequisites Checklist (Recommended, derived from gaps identified above)

- [ ] Migration 010 executed and RLS policy verified via `pg_policies` query (see `Security_RLS_Documentation.md` §4)
- [ ] Production SMS OTP provider connected and tested
- [ ] Payment gateway connected, webhook signature verification implemented and tested
- [ ] `user-app` test runner added and passing (currently missing — see `Test_Plan_and_Report.md`)
- [ ] Bundle-size code-splitting applied (`manualChunks` for React, Supabase, Lucide) to resolve the >500kB warning
- [ ] Sentry (or equivalent) configured for both `admin-panel` and `user-app`
- [ ] Admin account password policy / MFA reviewed
- [ ] Environment variables / secrets management strategy documented (`[NOT SPECIFIED IN SOURCE]`)
- [ ] Backup/restore and disaster-recovery runbook for the Supabase project (`[NOT SPECIFIED IN SOURCE]`)
- [ ] iOS build status confirmed — only Android is mentioned in the Source Document

## 6. Rollback Strategy
`[NOT SPECIFIED IN SOURCE]` — no rollback or blue/green deployment strategy is documented. Given migrations are described as idempotent (000–010), a forward-migration-only strategy is implied but not explicitly stated as intentional policy.

## 7. Monitoring & Observability (Post-Launch)
- Planned: Sentry error monitoring (Phase 4) — not yet configured.
- `[NOT SPECIFIED IN SOURCE]`: uptime monitoring, log aggregation, alerting thresholds, on-call process.
