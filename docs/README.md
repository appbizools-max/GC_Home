# GC HOME+ — Project Documentation Set
**Generated:** September 19, 2026
**Source of truth:** `GC HOME+ — Complete Technical PRD & System Architecture Document` (Product & Engineering Specification, Document Version 2.0, "Verified Against Production Codebase," dated September 2026) — hereafter **"the Source Document."**

## Scope & Method (read this first)

This documentation set was produced from a single source: the technical document supplied in this conversation. **No repository, source code, live Supabase project, or running application was directly inspected.** Every fact, table name, screen name, workflow step, and status claim in these documents is carried over from the Source Document; nothing has been invented or assumed beyond it.

Two direct consequences:

1. **Everything here is only as accurate as the Source Document.** Where the Source Document says a module is "Completed (100%)" or a test suite is "10/10 PASS," these documents repeat that claim but label it **as-reported**, not independently verified.
2. **Gaps in the Source Document are gaps in these documents.** Where a professional document of this type would normally need information the Source Document doesn't provide (e.g., actual API request/response payloads, specific test case names, load/performance benchmarks, exact RLS policy SQL, CI/CD pipeline definitions), the relevant section says so explicitly rather than fabricating detail. These are marked **`[NOT SPECIFIED IN SOURCE]`**.

If the real repository (`admin-panel/`, `user-app/`, `migrations/`, existing `docs/`) is made available, every document below should be re-verified against it and the as-reported labels replaced with directly confirmed facts.

## Document Set

| # | Document | File | Purpose |
|---|----------|------|---------|
| 1 | Business Requirements Document | `BRD.md` | Business rationale, stakeholders, scope, success criteria |
| 2 | Product Requirements Document | `PRD.md` | Product-level features, user roles, workflows |
| 3 | System/Functional Requirements Spec | `SRS_FRD.md` | Detailed functional & non-functional requirements per module |
| 4 | System Architecture Document | `System_Architecture.md` | Stack, monorepo structure, component/data flow |
| 5 | Database Design & ERD | `Database_Design_ERD.md` | Schema, tables, relationships, constraints, RLS status |
| 6 | API Documentation | `API_Documentation.md` | Supabase REST/RPC surface actually implied by schema & flows |
| 7 | UI/UX Design Specification | `UIUX_Design_Specification.md` | Screens, navigation, role-based UI switching |
| 8 | Test Plan & Test Report | `Test_Plan_and_Report.md` | Test coverage as reported, gaps, recommended plan |
| 9 | Security & RLS Documentation | `Security_RLS_Documentation.md` | Auth model, RLS status per table, risks |
| 10 | Deployment & Environment Guide | `Deployment_Environment_Guide.md` | Environments, build/deploy steps, roadmap phases |
| 11 | Implementation / Technical Audit | `Implementation_Technical_Audit.md` | Implemented vs partial vs pending vs missing vs broken vs deprecated |
| 12 | Project Handover Document | `Project_Handover.md` | Ownership, access, runbooks, open items, contacts |

## Status Legend (used consistently across all documents)

| Label | Meaning |
|---|---|
| ✅ **Implemented** | Source Document states this is complete/functional |
| 🟡 **Partial** | Source Document states this is partially built, in demo/mock mode, or has an open gap |
| ⏳ **Pending** | Source Document lists this as planned/roadmap, not yet built |
| ❌ **Missing** | Referenced as expected (e.g., in original PRD baseline) but not present in implemented state |
| 🔴 **Broken / At-Risk** | Source Document flags this as a risk or failure condition |
| 🗑️ **Deprecated** | Source Document places this in `_ARCHIVE/` or marks it obsolete |
| `[NOT SPECIFIED IN SOURCE]` | No information available to confirm or deny — flagged, not guessed |

## Consistency Notes

- Technology versions, table names, screen names, and file paths are copied verbatim from the Source Document across all files below so the set stays internally consistent.
- The Source Document itself records a **backend discrepancy**: the original PRD baseline (`docs/PRD.md` in the repo) specified Firebase; the implemented system uses Supabase/PostgreSQL. This documentation set treats **Supabase/PostgreSQL as current/authoritative** throughout, and documents the Firebase baseline only in the audit/BRD as historical context.
