# API Specification
## Project Finance Dashboard

**Related documents:** 02-System-Architecture.md, 03-Database-Design.md, 05-Frontend-Architecture.md

---

## 1. Overview

REST API served by the NestJS backend. All endpoints return JSON, require authentication (except health checks), and scope every query to the authenticated user.

## 2. Base URL & Versioning

```
Local:      http://localhost:3001/api
Production: whatever the apps/api Vercel project's URL is, set as
            NEXT_PUBLIC_API_URL on the apps/web Vercel project — no custom
            api. subdomain is configured yet
```

No version prefix for MVP (single consumer — the first-party frontend). Introduce `/api/v1` only if a public API becomes a real requirement.

## 3. Authentication

All endpoints below except the root health check (`GET /` — marked `@Public()`) require a valid **Firebase Auth ID token**:

```
Authorization: Bearer <firebase_id_token>
```

The frontend obtains this from `firebase/auth`'s `getIdToken()` after Google sign-in (`apps/web/src/lib/api-client.ts`). The backend verifies it via `firebase-admin/auth` (`FirebaseAuthGuard`) and resolves `userId` from the verified token's `uid` — it is never accepted as a request parameter or body field. A 401 from the backend triggers the frontend to sign the user out and redirect to `/sign-in` (`apps/web/src/lib/api-client.ts`).

## 4. Common Response Format

**Success:**
```json
{
  "data": {}
}
```
There is no `meta`/pagination envelope implemented — all list endpoints currently return the full result set (see §11).

**Error:** NestJS's default exception shape (no custom exception filter exists yet):
```json
{
  "statusCode": 400,
  "message": ["amount must be a positive number"],
  "error": "Bad Request"
}
```

### Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error (class-validator DTO rejection) |
| 401 | Missing/invalid Firebase ID token |
| 404 | Resource not found — also returned (with `data: null`, not a 404 status) by detail endpoints when the resource exists but belongs to a different user, to avoid leaking existence |
| 500 | Unexpected server error |

## 5. Projects

### `GET /projects`
List projects for the authenticated user.
Query params: `status`, `clientId`, `search` (case-insensitive substring match on `name`, filtered in-memory since Firestore has no `contains` operator). `archived` always defaults to `false` server-side and is not currently exposed as a query param.

### `POST /projects`
```json
{
  "name": "Acme Website Redesign",
  "clientId": "clnt_123",
  "status": "active",
  "startDate": "2026-06-01"
}
```

### `GET /projects/:id`
Returns project detail including computed totals:
```json
{
  "data": {
    "id": "proj_123",
    "name": "Acme Website Redesign",
    "status": "active",
    "client": { "id": "clnt_123", "name": "Acme Corp" },
    "totals": { "income": 4500, "expenses": 320, "profit": 4180 }
  }
}
```

### `PATCH /projects/:id`
Partial update — same shape as POST, all fields optional.

### `POST /projects/:id/archive`
Archives a project (soft-delete). Does not delete income/expense history.

## 6. Clients

| Method | Path | Description |
|---|---|---|
| GET | `/clients` | List, supports `?search=` (case-insensitive substring on `name`, in-memory) |
| POST | `/clients` | Create — `{ name, email?, phone?, company? }` |
| GET | `/clients/:id` | Detail, includes associated projects |
| PATCH | `/clients/:id` | Update — same fields as POST, all optional |

There is no `DELETE /clients/:id`.

## 7. Income

| Method | Path | Description |
|---|---|---|
| GET | `/projects/:projectId/income` | List income for a project |
| POST | `/projects/:projectId/income` | Add income record |
| PATCH | `/income/:id` | Update an income record |
| DELETE | `/income/:id` | Delete an income record |

```json
// POST /projects/:projectId/income
{
  "amount": 2000,
  "description": "Down payment",
  "status": "paid",
  "date": "2026-06-01"
}
```

## 8. Expenses

| Method | Path | Description |
|---|---|---|
| GET | `/projects/:projectId/expenses` | List expenses for a project |
| POST | `/projects/:projectId/expenses` | Add expense |
| PATCH | `/expenses/:id` | Update an expense |
| DELETE | `/expenses/:id` | Delete an expense |

```json
// POST /projects/:projectId/expenses
{
  "amount": 20,
  "category": "domain",
  "description": "Domain renewal",
  "date": "2026-06-02"
}
```

## 9. Dashboard

### `GET /dashboard/summary`
```json
{
  "data": {
    "totalRevenue": 48200,
    "totalExpenses": 9100,
    "netProfit": 39100,
    "activeProjects": 6,
    "completedProjects": 14,
    "monthlyTrend": [
      { "month": "2026-05", "revenue": 8200, "expenses": 1400, "profit": 6800 },
      { "month": "2026-06", "revenue": 9100, "expenses": 1650, "profit": 7450 }
    ],
    "recentActivity": [
      { "type": "income", "projectId": "proj_123", "amount": 2000, "date": "2026-06-01" }
    ]
  }
}
```

## 10. Reports

| Method | Path | Description |
|---|---|---|
| GET | `/reports/monthly?month=2026-06` | Monthly financial summary |
| GET | `/reports/profitability` | Projects ranked by net profit / margin |
| GET | `/reports/expenses?groupBy=category` | Expense breakdown |
| GET | `/reports/revenue?groupBy=client` | Revenue breakdown |

## 11. Pagination, Filtering, Sorting Conventions

- **No pagination is implemented.** Every list endpoint returns its full result set; `page`/`pageSize` are not accepted anywhere. Fine at current data volume, but worth revisiting before this is used with years of history.
- **No client-controlled sorting.** Ordering is fixed per endpoint in the service (e.g. projects by `createdAt desc`, income/expenses by `date desc`) — there's no `?sort=` param.
- Filtering uses plain query params matching the field name (`?status=active`), plus `search` where noted above.

## 12. Rate Limiting

Not required for MVP (single user, low request volume). If the API is ever exposed publicly, add a per-IP limit at the edge before it's needed.
