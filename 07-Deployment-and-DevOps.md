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
| Database | Firestore | Serverless NoSQL. **Composite indexes for the app's filtered list queries have not been created yet** — see `03-Database-Design.md` §5, this will break those endpoints in a fresh project until fixed |
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

- **Composite indexes** (`03-Database-Design.md` §5) — currently missing. Create them via the Firebase console links Firestore surfaces on first failed query, or author a `firestore.indexes.json` and deploy via the Firebase CLI.
- Field additions/removals are additive by default; anything that needs a backfill across existing documents requires a one-off script (none exist in this repo yet).

## 7. Monitoring & Logging

| Concern | Suggested tool | Notes |
|---|---|---|
| Error tracking | Sentry (free tier) | Wire into both Next.js and NestJS |
| Frontend analytics | Vercel Analytics | Built in, no extra setup |
| API logs | Vercel's Function logs (Dashboard → Deployments → Functions) | Sufficient at this scale; revisit if volume grows |

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
