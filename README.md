# Project Finance Dashboard (MyDashboard)

A personal web app for freelancers, developers, and consultants to track the financial performance of their client projects — income, expenses, and profitability — in one dashboard instead of scattered spreadsheets.

Built for single-user personal use, but the data model and API are structured (`userId` on every document) so the same codebase can grow into a multi-tenant SaaS later without a rewrite.

> **Status:** MVP. Single user, single currency. This is a tracking tool, not accounting/tax-compliance software.

## What it does

- **Projects** — create, edit, archive, and view projects with their full income/expense history and computed profit; search and filter by name, client, or status.
- **Clients** — manage clients and assign them to projects.
- **Income & expenses** — track per-project income (with pending/paid/overdue status) and categorized expenses.
- **Dashboard** — total revenue, expenses, and net profit; active vs. completed project counts; a monthly trend chart; and a recent-activity feed.
- **Reports** — monthly summary, project profitability, expense breakdown, revenue breakdown, and trend — each also exportable to PDF.
- **Also shipped (beyond the original MVP scope):** invoices (with PDF generation and "send"), time tracking, file attachments, notifications (overdue income, upcoming recurring expenses), and Indonesian PPh UMKM tax calculation.

Profit and totals are **always calculated from the underlying records**, never stored, so they can't drift out of sync.

## Architecture

A single **Next.js (App Router)** application in `apps/web/` — there is no separate backend service. The API lives inside Next.js as Route Handlers (`src/app/api/**/route.ts`), each compiling to its own serverless function, with a service layer under `src/server/`. Data is stored in **Firestore** (accessed via the Firebase Admin SDK) and auth is handled by **Firebase Auth** (Google sign-in); every API request verifies the caller's ID token server-side and never trusts a client-supplied `userId`.

> **Docs vs. reality:** the design docs (`02-System-Architecture.md`, etc.) describe an earlier plan — originally PostgreSQL + Prisma + Clerk on Vercel/Railway/Neon, then a separate NestJS API in `apps/api/`. The shipped build diverged: it moved to Firestore + Firebase Auth, and later consolidated the NestJS API into the Next.js app for deployment simplicity. **There is no `apps/api/` in this repo.** `07-Deployment-and-DevOps.md` is the doc that most accurately reflects what is actually deployed.

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Server state | TanStack Query |
| Charts | Recharts |
| API | Next.js Route Handlers (`src/app/api/`) + service layer (`src/server/`) |
| Validation | `class-validator` / `class-transformer` DTOs at the API boundary |
| Database | Firestore (Firebase Admin SDK) |
| Auth | Firebase Auth (Google sign-in) |
| PDF | `@react-pdf/renderer` |
| Testing | Jest + Testing Library |
| Hosting | Vercel (single project) |

Firestore collections: `clients`, `projects`, `income`, `expenses`, `invoices`, `timeEntries`, `attachments` (see `src/server/collections.ts`). Firestore is schemaless — schema is enforced at the API boundary via DTOs, not the database.

## Repository layout

```
.
├── README.md                       # This file
├── 01-Product-Requirements-Document.md   # Design docs (see caveat above)
├── 02-System-Architecture.md       #   — treat 07 as the source of truth
├── 03-Database-Design.md           #     for what's actually deployed
├── 04-API-Specification.md
├── 05-Frontend-Architecture.md
├── 06-Development-Roadmap.md
├── 07-Deployment-and-DevOps.md
├── 08-Future-Features.md
├── plan.md                         # Build plan / phase log
├── package.json                    # npm workspaces root (workspaces: apps/*)
├── firebase.json                   # Firestore + emulator config
├── firestore.indexes.json          # Composite indexes
├── .firebaserc                     # Firebase project alias (mydashboard-2b323)
├── .github/workflows/              # CI (lint + test + build) and backup
└── apps/
    └── web/                        # The only deployable app (Next.js)
        ├── src/app/                # Pages + (dashboard) route group + api/ Route Handlers
        ├── src/server/             # Service layer, DTOs, Firestore access, local-mode store
        ├── src/components/         # UI, dashboard, project, and shared components
        ├── src/hooks/              # TanStack Query hooks per resource
        ├── src/lib/                # Firebase client, auth/toast/confirm contexts, local mode
        └── scripts/                # seed-demo, unseed-demo, backup-firestore, measure-perf
```

## Getting started

This is an npm-workspaces monorepo; `apps/web` is the only deployable app. Requires **Node.js 20**.

```bash
npm install
```

### Option A — Local mode (no Firebase needed)

The fastest way to run the app with zero external setup. Data lives in memory in the dev-server process and resets on restart; there's no sign-in (a fixed local user is assumed). See `apps/web/src/lib/local-mode.ts`.

```bash
# apps/web/.env.local
NEXT_PUBLIC_LOCAL_MODE=true
```

```bash
npm run dev --workspace web
# open http://localhost:3000
```

### Option B — With Firebase

Set the following in `apps/web/.env.local` (server-side `FIREBASE_*` values come from a Firebase service account; `NEXT_PUBLIC_FIREBASE_*` from Firebase project settings):

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=            # newlines escaped as \n
FIREBASE_DATABASE_ID=            # "(default)" for Standard, "default" for Enterprise edition

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Never commit a `.env` with real values — secrets are git-ignored. You can also run the Firebase emulator suite (auth, Firestore, UI) configured in `firebase.json`.

```bash
npm run dev --workspace web
```

## Scripts

Run from `apps/web` (e.g. `npm run <script> --workspace web`):

| Script | Purpose |
|---|---|
| `dev` | Start the Next.js dev server |
| `build` | Production build |
| `start` | Serve the production build |
| `lint` | ESLint |
| `test` / `test:watch` | Jest unit/integration tests |
| `seed` / `unseed` | Add / remove demo data (tagged `_demo:true`) |
| `backup` | Export Firestore data |
| `measure-perf` | Benchmark dashboard/report endpoints |

## Testing & CI

Tests are colocated as `*.spec.ts(x)` next to the code they cover and run with Jest. GitHub Actions (`.github/workflows/ci.yml`) runs `lint`, `test`, and `build` across workspaces on pushes to `master` and on every pull request.

## Deployment

Deployed as a **single Vercel project** with the Root Directory set to `apps/web`; it auto-deploys from `master` with per-PR preview deploys. The `app/api/*` Route Handlers run as Node.js serverless functions alongside the pages — same origin, same deploy, no CORS. Firestore backs the data and Firebase Auth handles sign-in. Full detail, including the composite-index and Firestore Enterprise-edition (`database: "default"`) caveats, is in `07-Deployment-and-DevOps.md`.

### Known scaling caveat

The dashboard and reports currently read a user's **entire** income/expense collections on each request (no pagination or date-range filtering server-side). This is fast at solo-founder data volumes but its read cost doesn't scale — under burst load at large seeded datasets it can trip a Firestore read quota. The documented cheap fix is to add date-range filtering to those queries rather than a full rewrite. See `07-Deployment-and-DevOps.md` §7a.

## Documentation

Numbered design docs (`01`–`08`) and `plan.md` capture requirements, architecture, database design, API spec, and the build history. Where they conflict with the shipped code, **the code and `07-Deployment-and-DevOps.md` are authoritative** (see the architecture caveat above).
