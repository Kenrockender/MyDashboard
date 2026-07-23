# Frontend Architecture
## Project Finance Dashboard

**Related documents:** 02-System-Architecture.md, 04-API-Specification.md

---

## 1. Overview

Next.js (App Router) + TypeScript frontend. Server state — everything that comes from the API — is owned by TanStack Query; local UI state uses React's built-in state. Styling is Tailwind CSS with shadcn/ui components for consistent, accessible primitives.

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Server state / data fetching | TanStack Query |
| Charts | Recharts |
| Forms | React Hook Form + Zod (recommended addition — needed for validated forms, not in the original stack list) |

## 3. Project Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx              # project list
│   │   │   └── [id]/page.tsx         # project detail
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── reports/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── dashboard/
│   │   ├── kpi-card.tsx
│   │   ├── trend-chart.tsx
│   │   └── recent-activity.tsx
│   ├── projects/
│   │   ├── project-form.tsx
│   │   ├── project-list.tsx
│   │   └── project-totals.tsx
│   ├── clients/
│   └── shared/
├── lib/
│   ├── api-client.ts                 # typed fetch wrapper
│   ├── query-keys.ts                 # centralized TanStack Query keys
│   └── validation/                   # Zod schemas shared with forms
├── hooks/
│   ├── use-projects.ts
│   ├── use-clients.ts
│   ├── use-dashboard.ts
│   └── use-reports.ts
└── types/
    └── api.ts                        # types mirrored from the backend contract
```

## 4. Routing Map

| Route | Purpose |
|---|---|
| `/dashboard` | KPI cards, trend chart, recent activity |
| `/projects` | Searchable/filterable project list |
| `/projects/[id]` | Project detail — income, expenses, computed totals |
| `/clients` | Client list/search |
| `/clients/[id]` | Client detail with associated projects |
| `/reports` | Monthly summary, profitability, expense/revenue breakdowns |

## 5. State Management

- **Server state** (projects, clients, income, expenses, dashboard, reports) lives entirely in TanStack Query — no duplicate copies in component state or a global store.
- **Query keys** are centralized in `lib/query-keys.ts` so cache invalidation after a mutation (e.g., adding an expense invalidates both the project detail query and the dashboard summary query) is consistent and discoverable.
- **Local UI state** (open/closed modals, form drafts, filter inputs) uses `useState`/`useReducer` — no need for Redux/Zustand at this scale.

## 6. UI Component System

shadcn/ui provides accessible primitives (Dialog, Table, Select, etc.) copied into `components/ui/`, then themed with Tailwind tokens. Domain components (`ProjectForm`, `KpiCard`) compose these primitives rather than styling from scratch each time.

## 7. Forms & Validation

React Hook Form manages form state; Zod schemas define validation rules once and are shared between client-side validation and, ideally, mirrored on the NestJS DTOs. Example: the "amount must be > 0" rule from `04-API-Specification.md` is enforced client-side before submit, with the server remaining the source of truth.

## 8. Charts (Recharts)

- Dashboard trend chart: a `<LineChart>` (revenue/expenses/profit as three lines) fed directly by the `monthlyTrend` array from `GET /dashboard/summary`.
- Expense breakdown report: `<PieChart>` or `<BarChart>` grouped by category.
- All chart components take typed props matching the API response shapes in `types/api.ts`.

## 9. Data Fetching Pattern

```ts
// hooks/use-dashboard.ts
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  });
}
```

Mutations follow the same pattern with `useMutation` + `onSuccess: () => queryClient.invalidateQueries(...)`.

## 10. Responsive Design Strategy

- Tailwind's default breakpoints (`sm`, `md`, `lg`) drive layout changes: KPI cards stack vertically below `md`, the project table becomes a card list below `sm`.
- Charts use Recharts' `ResponsiveContainer` so they never overflow on mobile.

## 11. Performance Considerations

- Dashboard route uses a single aggregated `/dashboard/summary` call rather than N+1 client-side requests, directly supporting the <2s load NFR.
- TanStack Query caching avoids refetching unchanged data on navigation between screens.
- Route-level code splitting is automatic with the Next.js App Router.
