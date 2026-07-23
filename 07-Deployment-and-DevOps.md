# Deployment & DevOps
## Project Finance Dashboard

**Related documents:** 02-System-Architecture.md, 06-Development-Roadmap.md

---

## 1. Overview

Deployment target is three managed services chosen for zero/low cost at personal-project scale and minimal ops overhead: Vercel (frontend), Railway (backend API), Neon (Postgres). The repo is an npm-workspaces monorepo (`apps/web`, `apps/api` — see `plan.md` Phase 0), deployed as two independent services.

## 2. Hosting Architecture

| Component | Service | Notes |
|---|---|---|
| Frontend | Vercel | Root Directory set to `apps/web`; auto-deploys from `main`, preview deploys per PR |
| Backend API | Railway | Service root set to `apps/api`; auto-deploys from `main` |
| Database | Neon | Serverless Postgres; supports branch databases for previews |
| File storage (future) | Cloudflare R2 | Not needed until attachments ship |

## 3. Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Local | `next dev` | `nest start --watch` | Local Postgres or a Neon dev branch |
| Preview | Vercel preview deploy | Railway preview environment (or manual) | Neon branch DB per PR |
| Production | Vercel production | Railway production service | Neon main branch |

## 4. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint --workspaces
      - run: npm run test --workspaces
      - run: npm run build --workspaces
```

Vercel and Railway both deploy on push to `main` natively via their GitHub integrations once connected — no separate deploy job needed here.

## 5. Environment Variables

| Variable | Used by | Example |
|---|---|---|
| `DATABASE_URL` | Backend (Prisma) | `postgresql://user:pass@host/db` |
| `CLERK_SECRET_KEY` | Backend | Clerk dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk dashboard |
| `NEXT_PUBLIC_API_URL` | Frontend | `https://api.<yourdomain>.com/api` |

Store these in Vercel's and Railway's environment variable settings per environment — never commit a `.env` with real values. Commit a blank `.env.example` instead.

## 6. Database Migrations in Production

- Never run `prisma migrate dev` against production.
- The deploy step runs `prisma migrate deploy`, applying only already-generated, committed migration files.
- Take a Neon branch/snapshot before any migration that alters or drops a column.

## 7. Monitoring & Logging

| Concern | Suggested tool | Notes |
|---|---|---|
| Error tracking | Sentry (free tier) | Wire into both Next.js and NestJS |
| Frontend analytics | Vercel Analytics | Built in, no extra setup |
| API logs | Railway's built-in log viewer | Sufficient at this scale; revisit if volume grows |

## 8. Backup & Disaster Recovery

- Neon provides point-in-time restore on paid tiers — confirm the retention window matches your risk tolerance for financial data.
- Consider a weekly `pg_dump` exported somewhere independent of Neon as a cheap extra safety net, since this is financial data with no other system of record.

## 9. Domain, SSL, DNS

- Point a custom domain at Vercel for the frontend; Vercel issues and renews SSL automatically.
- Point an `api.` subdomain at Railway for the backend, same SSL handling.

## 10. Rough Cost Estimate (personal-project scale)

| Service | Free tier sufficient? |
|---|---|
| Vercel | Yes, Hobby tier |
| Railway | Small monthly cost after free trial credit |
| Neon | Yes, free tier covers single-user data volume |
| Clerk | Yes, free tier covers a handful of users |

Directional only — check each provider's current pricing page before committing, since free-tier terms change.

## 11. Security Checklist

- [ ] All secrets in environment variables, not source control
- [ ] HTTPS enforced on both frontend and backend domains
- [ ] Every API route scoped to the authenticated user
- [ ] Input validation (DTOs) on every write endpoint
- [ ] Dependency vulnerability scanning enabled (e.g., GitHub Dependabot)
- [ ] Database backups confirmed working, not just configured
