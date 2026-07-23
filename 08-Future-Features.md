# Future Features
## Project Finance Dashboard

**Related documents:** 01-Product-Requirements-Document.md

---

## 1. Overview

These features are explicitly out of MVP scope. Listed here so they're captured, not forgotten, and so future prioritization starts from a menu instead of a blank page.

## 2. Feature List

| Feature | Description |
|---|---|
| Invoice Generator | Create and send client invoices directly from project income records |
| PDF Export | Export reports and invoices as PDF |
| File Attachments | Attach receipts/contracts to expenses and projects |
| Time Tracking | Log hours per project, optionally tie to hourly-rate income |
| Budget Planning | Set a budget per project and track actual vs. planned |
| Tax Calculation | Estimate tax owed based on tracked income |
| Multi-Currency | Support clients/projects billed in non-USD currencies |
| Calendar Integration | Sync project deadlines/payment due dates to an external calendar |
| Notifications | Alerts for overdue income, upcoming recurring expenses |
| AI Insights | Pattern detection across projects (e.g., "marketing expenses spike in Q4") |
| Profit Forecasting | Predict future profit based on historical trend |
| Multi-User Support | Multiple accounts — the actual SaaS pivot |
| Team Permissions | Role-based access once multi-user exists |

## 3. Prioritization Framework

A simple Impact vs. Effort read on each, to sanity-check ordering before committing real time:

| Feature | Impact | Effort | Notes |
|---|---|---|---|
| Invoice Generator | High | Medium | Directly extends the existing Income model |
| PDF Export | Medium | Low | Useful once any report/invoice exists to export |
| Notifications | Medium | Low-Medium | Directly addresses "forgetting recurring expenses" from the PRD's problem statement |
| Time Tracking | Medium | Medium | New data model, but self-contained |
| File Attachments | Low-Medium | Medium | Needs storage (Cloudflare R2) wired in first |
| Multi-Currency | Low, for a solo single-currency user | Medium | Prioritize only once actually billing in multiple currencies |
| Tax Calculation | Low | High | Correctness bar is high; risky to get wrong |
| AI Insights / Forecasting | Low until enough historical data exists | High | Needs several months of real data to be meaningful |
| Multi-User Support | N/A for personal use | High | The actual SaaS pivot — its own project, not an incremental feature |
| Team Permissions | N/A until multi-user exists | High | Depends on Multi-User Support |

## 4. Suggested Order (if/when pursued)

1. **Invoice Generator** — closes the loop on income tracking, highest day-to-day value.
2. **PDF Export** — small effort, pairs naturally with invoices and reports.
3. **Notifications** — directly addresses a named pain point from the original problem statement.
4. **Time Tracking** — self-contained, doesn't block anything else.
5. **File Attachments** — once storage is wired in anyway.
6. Everything else — revisit based on actual usage patterns once the MVP has been lived with for a few months.

## 5. Path to Multi-User SaaS

When the SaaS pivot becomes real, the sequence is:

1. Add `Organization`/`Team` tables; move ownership from `User` to `Organization` (or keep both, with `Organization` optional for solo users).
2. Add role-based permissions (owner, member, viewer) on project/client access.
3. Add billing (Stripe) for subscription management.
4. Add per-tenant data isolation checks in the API layer — defense in depth on top of the `userId`/`orgId` scoping already in place from MVP (`02-System-Architecture.md` §9).

This is deliberately last because every MVP architecture decision was made specifically to make this step additive rather than a rewrite.
