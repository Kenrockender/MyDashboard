# Product Requirements Document
## Project Finance Dashboard

| | |
|---|---|
| **Document Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-07-24 |
| **Related Documents** | 02-System-Architecture.md, 03-Database-Design.md, 06-Development-Roadmap.md |

---

## 1. Executive Summary

Project Finance Dashboard is a personal web application that helps freelancers, developers, and consultants manage the financial performance of their client projects. It replaces scattered spreadsheets with a single dashboard that tracks project income, expenses, and profitability in real time.

The MVP is built for single-user personal use, but the data model and architecture are designed so the same codebase can grow into a multi-user SaaS product later without a rewrite.

## 2. Problem Statement

Freelancers and consultants juggling multiple client projects typically track finances in ad-hoc spreadsheets — one per client, or one master sheet. As the number of active projects grows, this creates recurring problems:

- **Lost visibility** — profitability per project isn't obvious until someone manually totals it up.
- **Forgotten recurring costs** — hosting, domains, and subscriptions tied to a project are easy to lose track of.
- **No comparability** — no easy way to see which projects or clients are actually worth the time.
- **No centralized dashboard** — financial health is scattered across files instead of visible at a glance.
- **No historical trend view** — month-over-month revenue, expenses, and profit aren't tracked anywhere.

## 3. Vision & Goals

**Vision:** A single source of truth for project finances — showing exactly how much each project earns, costs, and profits.

**Goals:**
1. Replace spreadsheets entirely for financial tracking.
2. Track every project's finances in one place.
3. Make project profitability visible at a glance.
4. Visualize monthly business performance over time.
5. Build on a foundation that can scale into a multi-user SaaS product later.

## 4. Target Users

### 4.1 Primary Persona — MVP
**Solo Dev / Freelancer (the current user).** Runs multiple concurrent client projects, currently tracks finances in spreadsheets, wants a fast way to see profit per project and per month. Single user of the system for the MVP.

### 4.2 Future Personas — Post-MVP
- **Consultant / Agency Owner** — manages a team, needs multi-user access and permissions.
- **Small Agency Finance Lead** — needs multi-currency and tax support across clients.

## 5. Scope

### 5.1 In Scope (MVP)
- Project management (create, edit, archive, view)
- Client management (create, edit, search, assign to project)
- Income tracking per project
- Expense tracking per project, with categories
- Dashboard with KPIs and monthly trends
- Reports: monthly summary, project profitability, expense breakdown, revenue breakdown
- Single-user authentication

### 5.2 Out of Scope (MVP)
Deferred to post-MVP — see `08-Future-Features.md`:
Invoicing/PDF export, file attachments, time tracking, budget planning, tax calculation, multi-currency, calendar integration, notifications, AI insights/forecasting, multi-user support, team permissions.

## 6. Functional Requirements

Each requirement carries an ID for traceability into the API spec and roadmap.

### 6.1 Project Management
| ID | Requirement |
|---|---|
| FR-1.1 | As a user, I can create a project with a name, client, status, and start date. |
| FR-1.2 | As a user, I can edit any project's details. |
| FR-1.3 | As a user, I can archive a project without deleting its financial history. |
| FR-1.4 | As a user, I can view a project detail page showing all income, expenses, and computed profit. |
| FR-1.5 | As a user, I can search and filter projects by name, client, or status. |

### 6.2 Client Management
| ID | Requirement |
|---|---|
| FR-2.1 | As a user, I can create a client with name and contact info. |
| FR-2.2 | As a user, I can edit a client's details. |
| FR-2.3 | As a user, I can search clients by name. |
| FR-2.4 | As a user, I can assign a client to one or more projects. |

### 6.3 Income Tracking
| ID | Requirement |
|---|---|
| FR-3.1 | As a user, I can add an income record to a project (amount, date, description, payment status). |
| FR-3.2 | As a user, I can edit an income record. |
| FR-3.3 | As a user, I can delete an income record. |
| FR-3.4 | As a user, I can mark income as pending, paid, or overdue. |

### 6.4 Expense Tracking
| ID | Requirement |
|---|---|
| FR-4.1 | As a user, I can add an expense to a project with amount, category, description, and date. |
| FR-4.2 | As a user, I can edit an expense. |
| FR-4.3 | As a user, I can delete an expense. |
| FR-4.4 | As a user, I can categorize expenses (Hosting, Domain, API Usage, Software Subscription, Freelancer, Marketing, Miscellaneous). |

### 6.5 Dashboard
| ID | Requirement |
|---|---|
| FR-5.1 | As a user, I see total revenue, total expenses, and net profit across all projects. |
| FR-5.2 | As a user, I see counts of active vs. completed projects. |
| FR-5.3 | As a user, I see a monthly revenue/expense/profit trend chart. |
| FR-5.4 | As a user, I see a feed of recent financial activity. |

### 6.6 Reports
| ID | Requirement |
|---|---|
| FR-6.1 | As a user, I can view a monthly financial summary report. |
| FR-6.2 | As a user, I can view a project profitability report ranking projects by margin. |
| FR-6.3 | As a user, I can view an expense breakdown report by category. |
| FR-6.4 | As a user, I can view a revenue breakdown report by client or project. |

## 7. Non-Functional Requirements
| Category | Requirement |
|---|---|
| Performance | Dashboard loads in under 2 seconds. |
| Security | Authentication is encrypted; secrets never stored in plaintext or committed to source control. |
| Responsiveness | UI works on desktop, tablet, and mobile breakpoints. |
| Availability | Target 99.9% uptime (bounded by managed-hosting SLAs — see `07-Deployment-and-DevOps.md`). |
| Scalability | Data model and API are tenant-ready so multi-user support doesn't require a rewrite. |
| Data integrity | Financial totals are always calculated, never manually entered, so they can't drift. |

## 8. Success Metrics
- Every project has complete income and expense records.
- Monthly profit is visible instantly, with no manual calculation.
- The user has fully stopped using spreadsheets for project finances.
- Dashboard consistently loads in under 2 seconds.
- Financial calculations are 100% accurate against manual spot-checks.

## 9. Assumptions & Constraints
- Single user, single currency (USD assumed) for MVP.
- No accounting/tax compliance guarantees — this is a tracking tool, not accounting software.
- Hosting favors free/low-cost tiers given personal-project scale.
- User is technical enough to self-host/deploy.

## 10. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Scope creep from the long future-features list | Delays MVP | Strict MVP scope lock; future features tracked separately |
| Manual data entry fatigue reduces actual usage | Tool gets abandoned, like the spreadsheets it replaces | Keep income/expense entry to minimal fields; consider a quick-add UI |
| Profit calculations silently wrong due to a bug | Bad business decisions | Unit test all financial calculation logic |
| Single-user auth becomes a blocker for a future SaaS pivot | Rework needed later | Model schema with `userId` from day one (see `03-Database-Design.md`) |

## 11. Glossary
| Term | Definition |
|---|---|
| Project | A unit of client work with its own income and expenses |
| Income | A payment received (or expected) for a project |
| Expense | A cost incurred in delivering a project |
| Net Profit | Total income minus total expenses for a project or period |
| MVP | Minimum Viable Product — the single-user scope defined in this document |
