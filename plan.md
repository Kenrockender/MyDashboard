# Project Finance Dashboard — Implementation Plan

> **Status: Phases 0-6 below are done and shipped** — the app is built, tested, and deployed (see checkbox state throughout, and `06-Development-Roadmap.md`). **The stack diverged from the plan as written**: Phase 0/Task 0.2 through Task 1.3's code snippets describe a **Prisma + PostgreSQL (Neon)** setup that was later replaced with **Firestore via the Firebase Admin SDK**, and Task 0.4/Phase 5's `Clerk` auth was replaced with **Firebase Auth (Google sign-in)**. Those snippets are left in place below as a historical record of the original plan, not as accurate documentation of what's in the repo — for the real implementation, read `apps/api/src/firebase/`, `apps/api/src/auth/`, and `apps/web/src/lib/firebase.ts`/`auth-context.tsx` directly, and see `02-System-Architecture.md` / `03-Database-Design.md` / `04-API-Specification.md`, which have all been updated to match the actual build.

**Goal:** Build the single-user MVP described in `01-Product-Requirements-Document.md` — a Next.js + NestJS app that tracks project income/expenses and shows profitability on a dashboard. *(Shipped, on Firestore rather than the PostgreSQL originally scoped below.)*

**Architecture:** Modular monolith — Next.js frontend, NestJS REST API, Firestore via the Firebase Admin SDK, in one npm-workspaces monorepo. Full detail in `02-System-Architecture.md`, `03-Database-Design.md`, `04-API-Specification.md`.

**Tech Stack:** Next.js, TypeScript, Tailwind, TanStack Query, NestJS, Firebase Admin SDK, Firestore, Firebase Auth, Recharts.

**How to use this plan:** Phases 0 and 1 below are fully detailed, task by task, checkbox by checkbox — as originally executed, with the Prisma-era code samples kept for history (see the status note above). Phases 2-6 are scoped — clear goal, files, and pattern to follow — but deliberately not expanded into full step-by-step tasks. All phases have since been completed; this doc is kept as a build record and a template for the *next* feature, not as a live checklist to re-execute from scratch.

---

## Phase 0: Project Setup

### Task 0.1: Initialize the repo and both apps

**Files:**
- Create: `package.json` (root, npm workspaces)
- Create: `apps/web/` (Next.js app)
- Create: `apps/api/` (NestJS app)

- [x] **Step 1: Create the monorepo root**

```bash
mkdir project-finance-dashboard && cd project-finance-dashboard
git init
npm init -y
```

- [x] **Step 2: Set up npm workspaces**

`package.json`:
```json
{
  "name": "project-finance-dashboard",
  "private": true,
  "workspaces": ["apps/*"]
}
```

- [x] **Step 3: Scaffold the frontend**

```bash
npx create-next-app@latest apps/web --typescript --tailwind --app
```

- [x] **Step 4: Scaffold the backend**

```bash
npx @nestjs/cli new apps/api --package-manager npm
```

- [x] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold monorepo with Next.js frontend and NestJS backend"
```

### Task 0.2: Add Prisma and connect to Neon

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/.env`, `apps/api/.env.example`

- [x] **Step 1: Install Prisma in the API app**

```bash
cd apps/api
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

- [x] **Step 2: Add the schema**

Copy the full schema from `03-Database-Design.md` §6 into `apps/api/prisma/schema.prisma`.

- [x] **Step 3: Set the connection string**

Create a free Neon project, copy its connection string into `apps/api/.env`:
```
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
```
Create `apps/api/.env.example` with the same key and a blank value, and add `.env` to `.gitignore`.

- [x] **Step 4: Run the first migration**

```bash
npx prisma migrate dev --name init
```
Expected: a migration is created under `apps/api/prisma/migrations/`, and `User`, `Client`, `Project`, `Income`, `Expense` tables exist in Neon.

- [x] **Step 5: Add and run the seed script**

Copy the seed script from `03-Database-Design.md` §9 into `apps/api/prisma/seed.ts`, then:
```bash
npx prisma db seed
```
Expected: console prints `Seeded user id: <cuid>` — copy this value, you'll need it in Task 0.4.

- [x] **Step 6: Verify**

```bash
npx prisma studio
```
Expected: browser opens showing one row in `User`, `Client`, `Project`, `Income`, `Expense`.

- [x] **Step 7: Commit**

```bash
git add apps/api/prisma apps/api/.env.example apps/api/.gitignore
git commit -m "feat: add Prisma schema, connect to Neon, seed sample data"
```

### Task 0.3: Base navigation shell

**Files:**
- Create: `apps/web/src/app/(dashboard)/layout.tsx`
- Create: `apps/web/src/components/shared/nav.tsx`
- Create: `apps/web/src/app/(dashboard)/{dashboard,projects,clients,reports}/page.tsx`

- [x] **Step 1: Write the nav component**

```tsx
// apps/web/src/components/shared/nav.tsx
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/clients", label: "Clients" },
  { href: "/reports", label: "Reports" },
];

export function Nav() {
  return (
    <nav className="flex gap-6 border-b px-6 py-4">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [x] **Step 2: Wire it into the dashboard layout**

```tsx
// apps/web/src/app/(dashboard)/layout.tsx
import { Nav } from "@/components/shared/nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Nav />
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [x] **Step 3: Add placeholder pages so links resolve**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard" "apps/web/src/app/(dashboard)/projects" "apps/web/src/app/(dashboard)/clients" "apps/web/src/app/(dashboard)/reports"
for p in dashboard projects clients reports; do
  printf 'export default function Page() {\n  return <div>%s</div>;\n}\n' "$p" > "apps/web/src/app/(dashboard)/$p/page.tsx"
done
```

- [x] **Step 4: Run it**

```bash
cd apps/web && npm run dev
```
Expected: visiting `localhost:3000/dashboard` shows the nav bar and a "dashboard" placeholder.

- [x] **Step 5: Commit**

```bash
git add apps/web/src/app apps/web/src/components
git commit -m "feat: add navigation shell and placeholder routes"
```

### Task 0.4: Minimal auth stub (replaced with real Clerk auth in Phase 5)

**Files:**
- Create: `apps/api/src/auth/current-user.decorator.ts`

- [x] **Step 1: Write the decorator**

```ts
// apps/api/src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: string;
}

// TEMPORARY: returns a fixed user id for every request so Phase 1-4 can be
// built and tested before real auth exists. Replaced with verified Clerk
// sessions in Phase 5 — see 06-Development-Roadmap.md Phase 5. Every
// controller from here on reads the user via @CurrentUser(), never a
// client-supplied field, so swapping this implementation later doesn't
// touch any controller code.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    return { userId: process.env.DEV_USER_ID ?? 'user_dev' };
  },
);
```

- [x] **Step 2: Set the matching env var**

Add to `apps/api/.env` (value from Task 0.2, Step 5):
```
DEV_USER_ID="<the id printed by the seed script>"
```
Add the same key with a blank value to `apps/api/.env.example`.

- [x] **Step 3: Commit**

```bash
git add apps/api/src/auth apps/api/.env.example
git commit -m "feat: add temporary auth stub, replaced by Clerk in Phase 5"
```

---

## Phase 1: Projects & Clients (full vertical slice — template for every later resource)

Clients is built first since Projects references it. Income and Expenses (Phase 2) follow this exact same shape.

### Task 1.1: Client module — backend

**Files:**
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/clients/clients.module.ts`
- Create: `apps/api/src/clients/clients.service.ts`
- Create: `apps/api/src/clients/clients.controller.ts`
- Create: `apps/api/src/clients/dto/create-client.dto.ts`
- Test: `apps/api/src/clients/clients.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [x] **Step 1: Add the Prisma service (needed by every module from here on)**

```ts
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [x] **Step 2: Write the failing test**

```ts
// apps/api/src/clients/clients.controller.spec.ts
import { Test } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'clnt_1', name: 'Acme Corp' }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockService }],
    }).compile();
    controller = module.get(ClientsController);
  });

  it('creates a client', async () => {
    const result = await controller.create({ name: 'Acme Corp' }, { userId: 'user_1' });
    expect(result.data.name).toBe('Acme Corp');
    expect(mockService.create).toHaveBeenCalledWith('user_1', { name: 'Acme Corp' });
  });
});
```

- [x] **Step 3: Run the test to verify it fails**

```bash
cd apps/api && npx jest clients.controller.spec.ts
```
Expected: FAIL — `Cannot find module './clients.controller'`.

- [x] **Step 4: Write the DTO**

```ts
// apps/api/src/clients/dto/create-client.dto.ts
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;
}
```

- [x] **Step 5: Write the service**

```ts
// apps/api/src/clients/clients.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({ data: { ...dto, userId } });
  }

  findAll(userId: string, search?: string) {
    return this.prisma.client.findMany({
      where: { userId, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.client.findFirst({ where: { id, userId }, include: { projects: true } });
  }

  update(userId: string, id: string, dto: Partial<CreateClientDto>) {
    return this.prisma.client.update({ where: { id, userId }, data: dto });
  }
}
```

- [x] **Step 6: Write the controller**

```ts
// apps/api/src/clients/clients.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  async create(@Body() dto: CreateClientDto, @CurrentUser() user: AuthUser) {
    const data = await this.clientsService.create(user.userId, dto);
    return { data };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    const data = await this.clientsService.findAll(user.userId, search);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.clientsService.findOne(user.userId, id);
    return { data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>, @CurrentUser() user: AuthUser) {
    const data = await this.clientsService.update(user.userId, id, dto);
    return { data };
  }
}
```

- [x] **Step 7: Wire the module and register it**

```ts
// apps/api/src/clients/clients.module.ts
import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService],
})
export class ClientsModule {}
```

Add `ClientsModule` to the `imports` array in `apps/api/src/app.module.ts`.

- [x] **Step 8: Run the test to verify it passes**

```bash
npx jest clients.controller.spec.ts
```
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add apps/api/src/prisma apps/api/src/clients apps/api/src/app.module.ts
git commit -m "feat: add Client CRUD API"
```

### Task 1.2: Client list & search UI — frontend

**Files:**
- Create: `apps/web/src/lib/api-client.ts`
- Create: `apps/web/src/hooks/use-clients.ts`
- Modify: `apps/web/src/app/(dashboard)/clients/page.tsx`

- [x] **Step 1: Typed API client**

```ts
// apps/web/src/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
```

- [x] **Step 2: Query hook**

```ts
// apps/web/src/hooks/use-clients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: () => apiClient.get<Client[]>(`/clients${search ? `?search=${search}` : ''}`),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; email?: string }) => apiClient.post<Client>('/clients', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
```

- [x] **Step 3: Page**

```tsx
// apps/web/src/app/(dashboard)/clients/page.tsx
'use client';
import { useState } from 'react';
import { useClients } from '@/hooks/use-clients';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const { data: clients, isLoading } = useClients(search);

  return (
    <div>
      <input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-3 py-2 mb-4"
      />
      {isLoading && <p>Loading...</p>}
      <ul className="space-y-2">
        {clients?.map((c) => (
          <li key={c.id} className="border rounded p-3">{c.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

Note: this app needs a `QueryClientProvider` wrapping the tree for TanStack Query to work — add it in `apps/web/src/app/layout.tsx` (a client component provider) before running this step, per the standard TanStack Query + Next.js App Router setup in their docs.

- [x] **Step 4: Run it**

With both apps running (`npm run dev` in `apps/api` and `apps/web`), visit `/clients` and confirm the seeded "Acme Corp" client (from Task 0.2) appears in the list, and that typing in the search box filters it.

- [x] **Step 5: Commit**

```bash
git add apps/web/src/lib apps/web/src/hooks/use-clients.ts "apps/web/src/app/(dashboard)/clients"
git commit -m "feat: add client list and search UI"
```

### Task 1.3: Project module — backend

Same six-step pattern as Task 1.1 (test → DTO → service → controller → module → commit), using the `Project` model and the endpoints in `04-API-Specification.md` §5. The one addition: `findOne` also returns computed `totals`.

**Files:**
- Create: `apps/api/src/projects/projects.module.ts`
- Create: `apps/api/src/projects/projects.service.ts`
- Create: `apps/api/src/projects/projects.controller.ts`
- Create: `apps/api/src/projects/dto/create-project.dto.ts`
- Test: `apps/api/src/projects/projects.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [x] **Step 1: Write the failing test for the totals calculation**

```ts
// apps/api/src/projects/projects.service.spec.ts
import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService.findOne totals', () => {
  let service: ProjectsService;
  const mockPrisma = {
    project: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'proj_1',
        income: [{ amount: 2000 }, { amount: 2500 }],
        expenses: [{ amount: 320 }],
      }),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ProjectsService);
  });

  it('computes income, expenses, and profit', async () => {
    const result = await service.findOne('user_1', 'proj_1');
    expect(result.totals).toEqual({ income: 4500, expenses: 320, profit: 4180 });
  });
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
npx jest projects.service.spec.ts
```
Expected: FAIL — `Cannot find module './projects.service'`.

- [x] **Step 3: DTO**

```ts
// apps/api/src/projects/dto/create-project.dto.ts
import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsIn(['active', 'completed', 'on_hold'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
```

- [x] **Step 4: Service, with the totals calculation**

```ts
// apps/api/src/projects/projects.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({ data: { ...dto, userId } });
  }

  findAll(userId: string, filters: { status?: string; clientId?: string; archived?: boolean }) {
    return this.prisma.project.findMany({
      where: { userId, archived: filters.archived ?? false, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { client: true, income: true, expenses: true },
    });
    if (!project) return null;

    const totalIncome = project.income.reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0);
    const totalExpenses = project.expenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);

    return {
      ...project,
      totals: { income: totalIncome, expenses: totalExpenses, profit: totalIncome - totalExpenses },
    };
  }

  update(userId: string, id: string, dto: Partial<CreateProjectDto>) {
    return this.prisma.project.update({ where: { id, userId }, data: dto });
  }

  archive(userId: string, id: string) {
    return this.prisma.project.update({ where: { id, userId }, data: { archived: true } });
  }
}
```

- [x] **Step 5: Controller**

```ts
// apps/api/src/projects/projects.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.create(user.userId, dto) };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    return { data: await this.projectsService.findAll(user.userId, { status, clientId }) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.findOne(user.userId, id) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateProjectDto>, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.update(user.userId, id, dto) };
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.archive(user.userId, id) };
  }
}
```

- [x] **Step 6: Module, register in `app.module.ts`, run tests, commit**

```ts
// apps/api/src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService],
})
export class ProjectsModule {}
```

```bash
npx jest projects.service.spec.ts   # expect PASS
git add apps/api/src/projects apps/api/src/app.module.ts
git commit -m "feat: add Project CRUD API with computed totals"
```

### Task 1.4: Project list, detail, and totals UI — frontend

Same pattern as Task 1.2, extended with a detail page.

**Files:**
- Create: `apps/web/src/hooks/use-projects.ts`
- Create: `apps/web/src/components/projects/project-totals.tsx`
- Modify: `apps/web/src/app/(dashboard)/projects/page.tsx`
- Create: `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`

- [x] **Step 1: Hook (mirrors `use-clients.ts`, plus a detail query)**

```ts
// apps/web/src/hooks/use-projects.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProjectTotals { income: number; expenses: number; profit: number; }
export interface Project { id: string; name: string; status: string; }
export interface ProjectDetail extends Project { totals: ProjectTotals; }

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', status],
    queryFn: () => apiClient.get<Project[]>(`/projects${status ? `?status=${status}` : ''}`),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiClient.get<ProjectDetail>(`/projects/${id}`),
    enabled: !!id,
  });
}
```

- [x] **Step 2: Totals display component**

```tsx
// apps/web/src/components/projects/project-totals.tsx
import type { ProjectTotals } from '@/hooks/use-projects';

export function ProjectTotalsCard({ totals }: { totals: ProjectTotals }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Income</p>
        <p className="text-xl font-semibold">${totals.income.toFixed(2)}</p>
      </div>
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Expenses</p>
        <p className="text-xl font-semibold">${totals.expenses.toFixed(2)}</p>
      </div>
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Profit</p>
        <p className="text-xl font-semibold">${totals.profit.toFixed(2)}</p>
      </div>
    </div>
  );
}
```

- [x] **Step 3: List page**

```tsx
// apps/web/src/app/(dashboard)/projects/page.tsx
'use client';
import Link from 'next/link';
import { useProjects } from '@/hooks/use-projects';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      <ul className="space-y-2">
        {projects?.map((p) => (
          <li key={p.id} className="border rounded p-3">
            <Link href={`/projects/${p.id}`}>{p.name} — {p.status}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [x] **Step 4: Detail page**

```tsx
// apps/web/src/app/(dashboard)/projects/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { ProjectTotalsCard } from '@/components/projects/project-totals';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <p>Loading...</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <ProjectTotalsCard totals={project.totals} />
    </div>
  );
}
```

- [x] **Step 5: Run it**

Visit `/projects`, click into the seeded "Acme Website Redesign" project, confirm totals show Income $2000.00, Expenses $20.00, Profit $1980.00 (matching the seed data from `03-Database-Design.md` §9).

- [x] **Step 6: Commit**

```bash
git add apps/web/src/hooks/use-projects.ts apps/web/src/components/projects "apps/web/src/app/(dashboard)/projects"
git commit -m "feat: add project list and detail UI with computed totals"
```

---

## Phase 2: Income & Expense Tracking (scope — expand before starting) — done

**Goal:** Add/edit/delete Income and Expense records nested under a project; the totals shown in Task 1.4 start reflecting real, user-entered data instead of only seed data.

**Files to touch:** `apps/api/src/income/*`, `apps/api/src/expenses/*` (mirroring the `clients/` structure from Task 1.1 exactly), `apps/web/src/components/projects/income-list.tsx`, `apps/web/src/components/projects/expense-list.tsx`, `apps/web/src/hooks/use-income.ts`, `apps/web/src/hooks/use-expenses.ts`.

**Pattern to follow:** identical backend shape to Task 1.1/1.3 (failing test → DTO → service → controller → module → passing test → commit); identical frontend shape to Task 1.2/1.4. Endpoints are fully specified in `04-API-Specification.md` §7-8; schema is fully specified in `03-Database-Design.md` §3.4-3.5. On the frontend, adding an income/expense mutation must invalidate the `['projects', id]` query key (Task 1.4) so totals update immediately — this is the one integration detail that isn't obvious from the pattern alone.

## Phase 3: Dashboard (scope) — done

**Goal:** `GET /dashboard/summary` aggregation endpoint, plus KPI cards, a monthly trend chart, and a recent activity feed on `/dashboard`.

**Files to touch:** `apps/api/src/dashboard/*`, `apps/web/src/app/(dashboard)/dashboard/page.tsx`, `apps/web/src/components/dashboard/*`.

**Key logic to test explicitly:** grouping income/expense rows by month for `monthlyTrend`. This is the one piece of non-trivial business logic in this phase and deserves a real unit test with fixture data spanning a month boundary, not just a manual check.

**Contract:** fully specified in `04-API-Specification.md` §9.

## Phase 4: Reports (scope) — done

**Goal:** Four report endpoints/screens per `04-API-Specification.md` §10.

**Files to touch:** `apps/api/src/reports/*`, `apps/web/src/app/(dashboard)/reports/page.tsx`.

**Important:** the profitability and revenue-by-client reports reuse the same profit calculation as Task 1.3 and Phase 3. Before writing this phase's tests, extract that calculation into a shared helper (`apps/api/src/common/calculate-profit.ts`) and backfill `ProjectsService.findOne` and the Phase 3 dashboard aggregation to call it, so profit is computed in exactly one place in the codebase.

## Phase 5: Auth & Hardening (scope) — done

**Goal:** Replace the `CurrentUser` stub from Task 0.4 with real session verification; add validation and error-handling polish across every endpoint built so far. *(Done — implemented as Firebase Auth, not the Clerk originally scoped here; see `apps/api/src/auth/firebase-auth.guard.ts`.)*

**Files to touch:** `apps/api/src/auth/*` (replace the decorator's implementation, keep its name and return shape identical so no controller changes), every existing controller only needs re-testing, not rewriting, since they already depend on the `AuthUser` interface rather than the stub directly.

## Phase 6: Deploy (scope) — done, though see Definition of Done for unverified items

**Goal:** First production deploy. Follow `07-Deployment-and-DevOps.md` directly — it's already written at execution-ready detail (exact env vars, exact CI config, exact migration command).

---

## Definition of Done (MVP)

- [x] Every functional requirement in `01-Product-Requirements-Document.md` §6 has a corresponding, tested endpoint and UI — verified FR-1.1 through FR-6.4 against the actual controllers/pages; the last gaps (FR-1.2 project edit, FR-1.5 project search/filter, FR-3.4 income payment status) were closed in the session that added this note.
- [x] Dashboard loads in under 2 seconds with realistic data volume (NFR) — **measured**: `GET /api/dashboard/summary` at 3-years/5x-scale seeded data (30 clients, 51 projects, ~2,500 income+expense records) returned in min 284ms / p50 317ms / p95 525ms — comfortably under 2s. See `07-Deployment-and-DevOps.md` §7a for the full writeup, including a Firestore read-quota exhaustion hit while measuring the Reports endpoints at that same volume (a real, reproduced bottleneck in the no-pagination `getAllRecords` pattern, documented with a cheapest-fix option, not yet acted on).
- [x] All financial totals are calculated via the single shared helper introduced in Phase 4, not duplicated logic — confirmed: `apps/api/src/common/calculate-profit.ts` is the only place profit math happens, used by `ProjectsService`, `DashboardService`, and `ReportsService`.
- [x] Deployed and reachable, behind real auth (not the Task 0.4 stub) — auth is Firebase Auth, not the Clerk originally planned. Confirmed live: both Vercel projects (`mydashboard-web`, `mydashboard-api`) build and serve from GitHub `master` via git integration; API's public health check returns 200, a protected route correctly returns 401, and Firestore composite indexes (03-Database-Design.md §5) are deployed. Along the way, fixed real production bugs that had nothing to do with the code being wrong per se: `jose` 6.x (pulled in by `firebase-admin/auth` via `jwks-rsa`) is ESM-only and crashed every single request until pinned to `^4.15.9` via a root `package.json` override; the Vercel projects' Root Directory settings and `NEXT_PUBLIC_FIREBASE_*` / `FIREBASE_*` environment variables weren't set at all (the only prior deploys were one-off CLI pushes, not git-integrated); and `FIREBASE_PRIVATE_KEY` needed its surrounding quotes stripped before being stored as a Vercel env var. No custom domain is configured — reachable only at the `*.vercel.app` URLs for now.
- [ ] Spreadsheets are no longer needed for project finances — the actual success metric from the PRD. Not something a repo/code check can confirm — this is a real-world usage outcome to assess once the app is actually in daily use.

## Post-MVP Hardening & Ops (added after "what's still missing?" review)

- [x] **API security headers** — `helmet()` applied globally in `create-app.ts`.
- [x] **CORS locked down** — `enableCors()` now reads an allowlist from `CORS_ORIGINS` (comma-separated) instead of allowing every origin; defaults to `http://localhost:3000` for dev. **Set in Vercel:** `CORS_ORIGINS` is configured on the `mydashboard-api` project (Production) with the three stable web aliases (`https://web-three-zeta-25.vercel.app`, `https://mydashboard-web-kenrockenders-projects.vercel.app`, `https://mydashboard-web-git-master-kenrockenders-projects.vercel.app`). Verified live: allowed origin gets `Access-Control-Allow-Origin`, `evil.example.com` gets none. **When a custom domain is added to the web app, append it to `CORS_ORIGINS` and redeploy the API** — env changes only take effect on a new deployment (e.g. `cd apps/api && vercel env rm CORS_ORIGINS production && printf '<new comma-separated list>' | vercel env add CORS_ORIGINS production && vercel redeploy <latest api prod url>`).
- [x] **Rate limiting** — `@nestjs/throttler` registered as a global guard (120 req/min/IP). Note: in-memory store is per-serverless-instance on Vercel, so it's a floor, not a hard global cap.
- [x] **Centralized error handling + logging** — `AllExceptionsFilter` (`common/all-exceptions.filter.ts`) turns every unhandled error into a consistent `{ error }` JSON envelope, logs 5xx with stack traces and 4xx as warnings, and never leaks internal error detail. This is the single hook point for wiring an external error tracker (Sentry) later — forward `exception` from there once a `SENTRY_DSN` is available.
- [x] **JSON health endpoint** — `GET /api/health` returns `{ status, uptime, timestamp }` (public), suitable for uptime monitors. Covered by unit + e2e tests.
- [x] **Firestore backup** — `npm run backup` (in `apps/api`) exports every collection to a timestamped JSON file under `backups/` (gitignored). Schedule via cron/CI for regular off-site copies.
- [ ] **External error tracker (Sentry) not wired** — the filter hook exists but no DSN is configured; needs a Sentry account + `SENTRY_DSN` env var.
- [ ] **Dashboard performance still unmeasured** (see NFR above) — unchanged; needs a real measurement against production data volume.
- [ ] **Custom domain** — still on `*.vercel.app`. When added, remember the CORS follow-up noted in the "CORS locked down" item above: append the new domain to `CORS_ORIGINS` on `mydashboard-api` and redeploy the API.

## Self-Review Notes

- **Spec coverage:** Phases 0-1 fully cover FR-1.x (Projects) and FR-2.x (Clients). Phases 2-4 map to FR-3.x through FR-6.x — intentionally scoped rather than task-level, per "How to use this plan" above.
- **Type consistency to watch when expanding later phases:** `AuthUser` (defined once in Task 0.4, reused everywhere — don't redefine it per module) and the `totals`/`ProjectTotals` shape (`{ income, expenses, profit }`, used identically in Project detail, Dashboard, and Reports — keep it as one shared type in `apps/api/src/common/types.ts`, mirrored in `apps/web/src/hooks/use-projects.ts`, rather than letting each phase invent its own shape).
