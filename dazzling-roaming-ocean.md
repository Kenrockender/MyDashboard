# Implementation Plan: Merge `apps/api` into `apps/web` (single Next.js app)

## Context

`apps/api` (NestJS) and `apps/web` (Next.js) are currently two independent Vercel projects, deployed and communicating cross-origin (CORS configured via `CORS_ORIGINS`). The user wants to simplify deployment to one Vercel project with no CORS — motivated purely by deployment simplicity, not by the ongoing Firestore quota issue (confirmed explicitly: merging does **not** fix that; it's a database billing/quota problem, orthogonal to app architecture).

This is the largest change of the session: ~15 services, ~15 controllers (~100+ individual routes), ~93 backend tests, and every cross-cutting concern (auth, validation, error handling, rate limiting, security headers, CORS) need to move from NestJS's DI/decorator model into Next.js App Router Route Handlers, which are plain async functions with no framework runtime of their own. Business logic (services, DTOs, pure calculation functions) is framework-agnostic already and ports with minimal change; the mechanical translation is in the controllers and cross-cutting wiring.

**Two decisions locked in with the user:**
- PDF: upgrade `@react-pdf/renderer` to v4 (matching `apps/web`'s existing React 19, instead of the React 18 pin `apps/api` needed today) and use `next/jest` (Next.js's official Jest preset, which transforms ESM node_modules via SWC) instead of plain `ts-jest` — this likely eliminates the CJS/ESM conflict that forced today's downgrade, rather than working around it again.
- Migration is big-bang: NestJS routes and Next.js API routes can't coexist cleanly mid-transition, so everything moves in one pass, gets fully tested, then cuts over.

## Cross-cutting architectural translations

| NestJS concept | Next.js equivalent | Notes |
|---|---|---|
| `FirebaseService` (DI-injected) | `apps/web/src/server/firebase.ts` — module-level singleton exporting `db` (Firestore) and `auth` (Admin Auth), built once at import time | Same `getFirebaseApp()`/`cert()` logic as `apps/api/src/firebase/firebase-app.ts`, just no DI container |
| `FirebaseAuthGuard` + `@CurrentUser()` | `apps/web/src/server/require-user.ts` — `async function requireUser(req: NextRequest): Promise<{userId: string}>`, throws `UnauthorizedException` (from `@nestjs/common` — see below) if the `Authorization: Bearer` header is missing/invalid | Every route handler's first line |
| `NotFoundException`/`BadRequestException`/`UnauthorizedException` (`@nestjs/common`) | **Keep using them as-is** | These are plain classes with a `getStatus()` method — no Nest runtime needed to throw/catch them outside an app instance. Confirmed reusable directly; no need to hand-roll replacement error classes |
| `ValidationPipe` + DTO classes (`class-validator`) | `apps/web/src/server/validate.ts` — `async function validateBody<T>(cls: ClassConstructor<T>, raw: unknown): Promise<T>` using `plainToInstance` + `validate()` (both already deps), throws `BadRequestException` on failure | DTO classes themselves (`CreateInvoiceDto` etc.) move unchanged into `apps/web/src/server/*/dto/` |
| `AllExceptionsFilter` (`{error}` envelope) | `apps/web/src/server/respond.ts` — `withRoute(handler)` wrapper: catches thrown exceptions, maps `HttpException`-shaped errors to `{error: {statusCode, message, path, timestamp}}`, everything else to 500, logs 5xx with stack / 4xx as warn (same split as today) | Every exported `GET`/`POST`/`PATCH`/`DELETE` wraps its body in this |
| `{data}` success envelope | `respond.ts` also exports `ok(data)` → `NextResponse.json({data})` | |
| `@nestjs/throttler` rate limiting | Small in-memory limiter ported into `withRoute` (same 120 req/min/IP, same "floor not hard cap on serverless" caveat already documented) | No direct Next.js equivalent exists; hand-port the existing logic rather than drop it silently |
| `helmet()` | `next.config.ts`'s async `headers()` returning the same security header set helmet defaults to | |
| CORS (`enableCors`, `CORS_ORIGINS`) | **Deleted entirely** | Same-origin after merge — this whole concern disappears, which is the actual point of the merge |
| PDF `@Res()` raw-buffer routes | Route Handlers return `new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': ... } })` natively | Cleaner than Nest's `@Res()` escape hatch — no special-casing needed |
| Services (`*.service.ts`) | Move to `apps/web/src/server/<domain>/*.service.ts`, drop `@Injectable()`, export a singleton instance (`export const invoicesService = new InvoicesService();`) instead of relying on DI | Method bodies are untouched — they already only depend on `FirebaseService`/plain data, not Nest internals |
| Pure calculation functions (`calculate-profit.ts`, `calculate-monthly-trend.ts`, `calculate-overdue-income.ts`, `calculate-pph-umkm.ts`) | Move as-is into `apps/web/src/server/<domain>/` | Zero framework dependency already — literal copy |

## File layout after the merge

```
apps/web/src/
  app/api/
    clients/route.ts                          # GET, POST
    clients/[id]/route.ts                      # GET, PATCH
    projects/route.ts
    projects/[id]/route.ts
    projects/[id]/archive/route.ts
    projects/[projectId]/income/route.ts
    income/[id]/route.ts
    projects/[projectId]/expenses/route.ts
    expenses/[id]/route.ts
    expenses/[expenseId]/attachments/route.ts
    attachments/[id]/route.ts
    projects/[projectId]/invoices/route.ts
    invoices/route.ts
    invoices/[id]/route.ts
    invoices/[id]/pdf/route.ts
    invoices/[id]/send/route.ts
    projects/[projectId]/time-entries/route.ts
    time-entries/[id]/route.ts
    time-entries/[id]/log-income/route.ts
    notifications/overdue-income/route.ts
    dashboard/summary/route.ts
    reports/monthly/route.ts (+ /pdf)
    reports/trend/route.ts (+ /pdf)
    reports/profitability/route.ts (+ /pdf)
    reports/expenses/route.ts (+ /pdf)
    reports/revenue/route.ts (+ /pdf)
    tax/pph-umkm/route.ts
    health/route.ts
  server/
    firebase.ts                # db + auth singletons
    require-user.ts             # auth check
    validate.ts                 # DTO validation helper
    respond.ts                  # ok() + withRoute() wrapper (envelope + errors + rate limit)
    collections.ts               # COLLECTIONS + docToEntity (moved as-is)
    common/                       # calculate-profit.ts, currencies.ts (moved as-is)
    clients/clients.service.ts + dto/
    projects/projects.service.ts + dto/
    income/income.service.ts + dto/
    expenses/expenses.service.ts + dto/
    attachments/attachments.service.ts + dto/
    invoices/invoices.service.ts + dto/
    time-entries/time-entries.service.ts + dto/
    notifications/notifications.service.ts + calculate-overdue-income.ts
    dashboard/dashboard.service.ts + calculate-monthly-trend.ts + calculate-recent-activity.ts
    reports/reports.service.ts
    tax/tax.service.ts + calculate-pph-umkm.ts
    pdf/pdf.service.ts + documents/*.ts + format-money.ts
```

Every route file follows one pattern (mirrors today's controller methods exactly, just reshaped):

```ts
// app/api/projects/[projectId]/income/route.ts
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  return withRoute(async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateIncomeDto, await req.json());
    const { projectId } = await params;
    return ok(await incomeService.create(user.userId, projectId, dto));
  });
}
```

## Migration steps

1. **Scaffolding**: create `apps/web/src/server/{firebase,require-user,validate,respond}.ts`. Add `class-validator`, `class-transformer`, `firebase-admin` to `apps/web/package.json`. Copy `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`/`FIREBASE_DATABASE_ID` env vars into `apps/web/.env`/`.env.example` (currently only on the API side).
2. **Move domain-by-domain** (services + DTOs + pure functions first, since routes depend on them): clients → projects → income → expenses → attachments → invoices → time-entries → notifications → dashboard → reports → tax → pdf. For each: copy the service/DTO files into `apps/web/src/server/<domain>/`, strip `@Injectable()`, export a singleton.
3. **Write route handlers** for each domain, immediately after its service is moved — one Route Handler file per NestJS controller route grouping (nested vs flat, exactly matching today's URL shape so no frontend hook changes are needed beyond the base URL).
4. **PDF**: bump `@react-pdf/renderer` to latest v4 in `apps/web/package.json` (drop the separate `react: ^18.3.1` override entirely — one React version app-wide). Move `pdf/documents/*.ts` as-is (they don't reference React version specifics beyond JSX-free `createElement` calls, which are version-agnostic). Configure `next.config.ts`'s `transpilePackages: ['@react-pdf/renderer']` if Next's build doesn't pick it up automatically from `node_modules` ESM output — verify empirically (see Verification).
5. **`next.config.ts`**: add `headers()` for the helmet-equivalent security headers.
6. **Frontend `apiClient`** (`apps/web/src/lib/api-client.ts`): change `API_URL` default/usage to a same-origin relative path (`/api`) instead of `NEXT_PUBLIC_API_URL`; remove the env var from `.env.example` once confirmed unused.
7. **Tests**: set up `next/jest` in `apps/web` (new `jest.config.ts` using `next/jest`'s `createJestConfig`). Port pure-function specs and service specs as-is (drop `Test.createTestingModule`, just `new XService(fakeFirebase)` directly — `fake-firestore.ts` moves unchanged). For controller specs: don't port 1:1 — write a smaller set of route-handler smoke tests per domain (call the exported `GET`/`POST` with a constructed `NextRequest`, assert status + envelope shape), enough to catch wiring mistakes without doubling the porting effort.
8. **Retire `apps/api`**: once everything is moved, tested, and passing, delete the `apps/api` directory from the repo (its Vercel project itself needs manual removal by the user afterward — deleting a live Vercel project is an external-service action outside what I do automatically). Remove `apps/api` from root `package.json` workspaces.
9. **Docs**: update `07-Deployment-and-DevOps.md` (§1, §2, §5, §5a all describe the two-project split — rewrite to the single-project shape) and `plan.md`'s references to the split architecture.

## Verification

1. `cd apps/web && npx tsc --noEmit` — no type errors across the merged codebase.
2. `npm test` (new `next/jest`-based suite) — all ported pure-function and service tests pass; specifically confirm the `@react-pdf/renderer` v4 smoke tests (non-empty `%PDF-` buffer) pass under `next/jest`, which is the empirical check for whether the ESM/ CJS concern is actually resolved by the preset switch. If it isn't, fall back to explicit `transformIgnorePatterns`/`transpilePackages` config before considering the library-swap alternative.
3. `npm run build` in `apps/web` — confirms every Route Handler compiles and Next's build recognizes them as serverless functions (check the build output's route listing includes all `/api/*` entries).
4. Local run (`npm run dev` in `apps/web` only — no separate API process): sign in, and re-walk the same manual checks used earlier this session — create an invoice, download its PDF, send it, view a report PDF, check the notification bell, log a time entry, attach a file to an expense, check the tax estimate — confirming each still works end-to-end through the new same-origin `/api/*` routes.
5. Confirm `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` are no longer referenced anywhere (`grep -r` both across `apps/web/src`).
