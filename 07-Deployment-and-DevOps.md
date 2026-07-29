# Deployment & DevOps
## Project Finance Dashboard

**Related documents:** 02-System-Architecture.md, 06-Development-Roadmap.md

---

## 1. Overview

Deployment target: everything on Vercel, plus Firestore. The repo is an npm-workspaces monorepo (`apps/web`, `apps/api` — see `plan.md` Phase 0), deployed as two independent Vercel projects. The NestJS API runs as a Vercel Function (Node.js runtime) via `apps/api/api/index.ts`, which wraps the Nest app with the Express adapter and a catch-all `vercel.json` rewrite — not as a long-lived server. (Originally scoped for Vercel + Railway + Neon/Prisma + Clerk; moved to all-Vercel + Firestore + Firebase Auth mid-build.)

## 2. Hosting Architecture

| Component | Service | Notes |
|---|---|---|
| Frontend | Vercel | Root Directory set to `apps/web`; auto-deploys from `master`, preview deploys per PR |
| Backend API | Vercel | Root Directory set to `apps/api`; runs as a Node.js serverless function (`apps/api/api/index.ts`), not a long-lived process — see §5a |
| Database | Firestore, Enterprise edition, database named `default` (not the Standard-edition `(default)`) | Serverless NoSQL. Composite indexes deployed — see §6 |
| Auth | Firebase Auth | Google sign-in; frontend talks to it directly, backend verifies ID tokens via `firebase-admin/auth` |
| File storage (future) | Cloudflare R2 | Not needed until attachments ship |

## 3. Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Local | `next dev` | `nest start --watch` | Same Firestore project as production (no local/branch separation configured) |
| Preview | Vercel preview deploy | Vercel preview deploy (function) | Same Firestore project — previews are not data-isolated |
| Production | Vercel production | Vercel production (function) | Firestore production project |

## 4. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint --workspaces --if-present
      - run: npm run test --workspaces --if-present
      - run: npm run test:e2e --workspace=apps/api --if-present
      - run: npm run build --workspaces --if-present
```

Both Vercel projects (frontend and backend) deploy on push to `master` natively via their GitHub integrations once connected — no separate deploy job needed here. (The active branch is `master`, not `main` — the workflow trigger above was fixed to match; it previously only fired for `main` and never ran on pushes to this repo's actual default branch.)

## 5. Environment Variables

| Variable | Used by | Example |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Backend | Firebase service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Backend | Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | Backend | Firebase service account JSON, newlines escaped as `\n` |
| `FIREBASE_DATABASE_ID` | Backend | `(default)` for standard Firestore, `default` for Enterprise edition |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Frontend | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Frontend | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Frontend | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Frontend | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Frontend | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Frontend | Firebase project settings |
| `NEXT_PUBLIC_API_URL` | Frontend | The `apps/api` Vercel project's URL, plus `/api` |

Store these in each Vercel project's environment variable settings per environment — never commit a `.env` with real values. Commit a blank `.env.example` instead (already done — see `apps/api/.env.example`, `apps/web/.env.example`).

## 5a. Running NestJS on Vercel (serverless, not a long-lived server)

- Entry point: `apps/api/api/index.ts` creates the Nest app once with the Express adapter (`configureApp()` — sets the `/api` prefix, CORS, and the global `ValidationPipe`), caches it across warm invocations, and hands each request to the underlying Express instance. `apps/api/vercel.json` rewrites every path to this one function so Nest's own router handles the full original path.
- `src/main.ts` (`app.listen(...)`) is only used for local dev (`nest start`) — Vercel never calls it.
- Firestore connections don't need the pooling concern Postgres had on serverless (no fixed connection limit in the same way) — the Firebase Admin SDK is initialized once per warm function instance in `getFirebaseApp()`.
- Cold starts include re-establishing the Firebase Admin app; expect the first request after idle to be slower than a warm one.

## 6. Data Model Changes in Production

Firestore is schemaless, so there's no migration step to run. What actually needs attention before/during deploy:

- **Composite indexes** (`03-Database-Design.md` §5) — deployed. `firebase.json` targets the `default` database explicitly (`{ "firestore": [{ "database": "default", ... }] }`) since this project's Firestore is Enterprise edition with a database literally named `default`, not the Standard-edition `(default)` the CLI assumes by default — using the plain-object `firestore.json` form here would make the CLI try to *create* a new `(default)` Standard database instead of deploying against the existing one, which fails with a billing-required error. If a new environment/project is ever set up, re-check `firebase firestore:databases:list --project <id>` before deploying to confirm which form applies.
- Field additions/removals are additive by default; anything that needs a backfill across existing documents requires a one-off script (none exist in this repo yet).

## 7. Monitoring & Logging

| Concern | Suggested tool | Notes |
|---|---|---|
| Error tracking | Sentry (free tier) | Wire into both Next.js and NestJS |
| Frontend analytics | Vercel Analytics | Built in, no extra setup |
| API logs | Vercel's Function logs (Dashboard → Deployments → Functions) | Sufficient at this scale; revisit if volume grows |

## 7a. Performance — Dashboard/Reports NFR

The PRD's "dashboard loads in under 2 seconds" NFR was measured directly (`apps/api/scripts/measure-perf.ts`, added alongside `seed-demo.ts`'s new `YEARS`/`SCALE` scaling options) against a seeded dataset of **30 clients, 51 projects, 1,262 income + 1,201 expense records** (3 years, 5x the normal demo scale) — well beyond what a solo founder accumulates in years of real use.

**Result — `GET /api/dashboard/summary`:** min 284ms · p50 317ms · p95 525ms · max 525ms (1 warmup + 10 timed runs, each doing its own live Firestore reads). **Comfortably under the 2s NFR** even at this scale.

**The rest of the measurement run couldn't complete**: the second endpoint (`reports/monthly`) hit a Firestore `RESOURCE_EXHAUSTED` / "Quota exceeded" error, and three immediate retries a minute apart all hit the same wall. This is itself the more important finding: `DashboardService` and every `ReportsService` method (`getAllRecords`) pull the user's **entire** income/expenses collections into memory on every single request — no pagination, no date-range filtering, no server-side aggregation anywhere in the codebase. At a few hundred docs (the original demo scale) that's invisible. At ~2,500 docs, hammering all 5 endpoints back-to-back (11 runs × 5 endpoints × 2-3 parallel full-collection reads each) was enough to trip a Firestore read quota within seconds — a concrete, reproduced example of the exact bottleneck this NFR was meant to catch.

**Verdict:** the dashboard itself is fast (well under 2s) at realistic solo-founder-scale data volumes. The risk isn't dashboard latency — it's that `getAllRecords`-style full-collection reads (used by every Report and the Dashboard) don't scale their **read cost**, only their compute cost, and that shows up as quota exhaustion under burst load well before it shows up as a slow page. **Cheapest fix if/when this matters in real usage** (not built now — this is a documented option, not a rewrite): add a date-range filter to `getAllRecords`'s and `DashboardService.getSummary`'s Firestore queries (e.g., only fetch the trailing N months for the trend chart, and load older data on demand for reports), rather than a full aggregation-engine rewrite.

**Load-test data cleanup note:** the seeded dataset above was written directly to the production Firestore project (`mydashboard-2b323`) — there is no emulator or staging database configured (see §3). It's tagged `_demo:true` exactly like the normal demo seed, removable at any time via `npm run unseed` from `apps/api`. Cleanup was attempted immediately after this measurement but **also hit the same quota exhaustion** and did not complete as of this writing — run `npm run unseed` once the quota window resets to confirm it's gone (check the Clients/Projects lists in the live app for entries like "Aurora Coffee Co. #5" or "GreenLeaf Internal Dashboard #4" as a quick visual check).

## 8. Backup & Disaster Recovery

- Firestore supports scheduled exports to Cloud Storage on the Blaze (pay-as-you-go) plan — not configured yet.
- Consider a periodic export somewhere independent of the live project as a cheap extra safety net, since this is financial data with no other system of record.

## 9. Domain, SSL, DNS

- Point a custom domain at Vercel for the frontend; Vercel issues and renews SSL automatically.
- Point an `api.` subdomain at the backend's Vercel project, same SSL handling.

## 10. Rough Cost Estimate (personal-project scale)

| Service | Free tier sufficient? |
|---|---|
| Vercel | Yes, Hobby tier (both projects) |
| Firestore | Yes, Spark (free) tier covers single-user data volume |
| Firebase Auth | Yes, free for this scale |

Directional only — check each provider's current pricing page before committing, since free-tier terms change.

## 11. Security Checklist

- [ ] All secrets in environment variables, not source control
- [ ] HTTPS enforced on both frontend and backend domains
- [ ] Every API route scoped to the authenticated user
- [ ] Input validation (DTOs) on every write endpoint
- [ ] Dependency vulnerability scanning enabled (e.g., GitHub Dependabot)
- [ ] Database backups confirmed working, not just configured
