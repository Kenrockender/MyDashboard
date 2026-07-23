# Development Roadmap
## Project Finance Dashboard

**Related documents:** 01-Product-Requirements-Document.md, plan.md

---

## 1. Overview

This roadmap sequences the MVP into phases ordered by dependency: data foundations first, then the CRUD screens that produce data, then the dashboard/reports that consume it. Durations are rough sizing for a solo builder working part-time — treat them as relative, not a committed schedule.

## 2. Phases

### Phase 0 — Foundations (~2-4 days)
Repo setup, Next.js + NestJS scaffolding, Prisma connected to Neon, base layout/navigation shell, CI pipeline skeleton.

### Phase 1 — Projects & Clients (~1 week)
Client CRUD (API + UI). Project CRUD (API + UI), including client assignment and archive. Search/filter on both.

### Phase 2 — Income & Expense Tracking (~1 week)
Income CRUD scoped to a project. Expense CRUD scoped to a project, with category selector. Project detail page shows computed totals (income, expenses, profit).

### Phase 3 — Dashboard (~4-6 days)
`/dashboard/summary` aggregation endpoint. KPI cards, monthly trend chart, recent activity feed. Verify the <2s load requirement against real data volume.

### Phase 4 — Reports (~4-6 days)
Monthly summary, profitability, expense breakdown, revenue breakdown — endpoints and screens.

### Phase 5 — Auth & Hardening (~3-5 days)
Wire in Clerk if deferred from Phase 0. Input validation everywhere, error-handling polish, responsive QA pass.

### Phase 6 — Deploy (~2-3 days)
Production Vercel/Railway/Neon setup, environment variables, first deploy. See `07-Deployment-and-DevOps.md`.

### Phase 7+ — Post-MVP
Pull from `08-Future-Features.md` based on actual usage once the MVP is live.

## 3. Milestones

| Milestone | Marks the end of |
|---|---|
| M1 — "I can log a project and a client" | Phase 1 |
| M2 — "I can log real income/expenses" | Phase 2 |
| M3 — "I can see my numbers at a glance" | Phase 3 |
| M4 — "I have the reports I used to build by hand" | Phase 4 |
| M5 — "It's live and it's mine" | Phase 6 |

## 4. Dependencies

- Phase 2 depends on Phase 1 (needs projects to attach income/expenses to).
- Phase 3 depends on Phase 2 (dashboard aggregates income/expense data).
- Phase 4 depends on Phase 3's aggregation logic (reports reuse the same calculations, sliced differently).
- Phase 5 (auth) can run in parallel with Phases 1-2 if Clerk is wired in from the start — recommended, since retrofitting auth onto unscoped queries later is exactly the kind of rework the architecture is trying to avoid (`02-System-Architecture.md` §9).

## 5. Suggested Order of Attack

For a step-by-step, file-level build guide for Phase 0 and Phase 1, see `plan.md`. Later phases follow the same pattern and are intentionally scoped rather than fully detailed there — expand each into its own detailed plan right before you start it.
