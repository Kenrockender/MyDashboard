# API Specification
## Project Finance Dashboard

**Related documents:** 02-System-Architecture.md, 03-Database-Design.md, 05-Frontend-Architecture.md

---

## 1. Overview

REST API served by the NestJS backend. All endpoints return JSON, require authentication (except health checks), and scope every query to the authenticated user.

## 2. Base URL & Versioning

```
Local:      http://localhost:3001/api
Production: https://api.<yourdomain>.com/api
```

No version prefix for MVP (single consumer — the first-party frontend). Introduce `/api/v1` only if a public API becomes a real requirement.

## 3. Authentication

All endpoints below (except `/health`) require a valid Clerk session token:

```
Authorization: Bearer <clerk_session_token>
```

The API resolves `userId` from the verified token — it is never accepted as a request parameter or body field.

## 4. Common Response Format

**Success:**
```json
{
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 42 }
}
```
`meta` is only present on paginated list endpoints.

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount must be greater than 0",
    "details": [{ "field": "amount", "issue": "must be > 0" }]
  }
}
```

### Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Missing/invalid auth |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 500 | Unexpected server error |

## 5. Projects

### `GET /projects`
List projects for the authenticated user.
Query params: `status`, `clientId`, `search`, `archived` (default `false`), `page`, `pageSize`

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
| GET | `/clients` | List, supports `?search=` |
| POST | `/clients` | Create |
| GET | `/clients/:id` | Detail, includes associated projects |
| PATCH | `/clients/:id` | Update |

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

- List endpoints accept `page` (default 1) and `pageSize` (default 20, max 100).
- Sorting: `?sort=createdAt:desc` (field:direction).
- Filtering uses plain query params matching the field name (`?status=active`).

## 12. Rate Limiting

Not required for MVP (single user, low request volume). If the API is ever exposed publicly, add a per-IP limit at the edge before it's needed.
