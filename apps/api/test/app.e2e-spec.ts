import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/create-app';
import { FirebaseService } from '../src/firebase/firebase.service';
import { FirebaseAuthService } from '../src/firebase/firebase-auth.service';
import { createFakeFirestore } from '../src/firebase/fake-firestore';

// This suite never talks to real Firebase. FirebaseService is swapped for an
// in-memory Firestore fake, and FirebaseAuthService is swapped for a fake
// that treats the bearer token itself as the verified user id ("login" is
// simulated this way since exercising real Google OAuth from an API e2e test
// isn't meaningful — the frontend is what talks to Firebase Auth directly).
// Everything downstream — the guard, controllers, services, DTO validation —
// runs for real.
async function buildApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(FirebaseService)
    .useValue(createFakeFirestore())
    .overrideProvider(FirebaseAuthService)
    .useValue({ verifyIdToken: (token: string) => Promise.resolve(token) })
    .compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

function authedClient(app: INestApplication, userId: string) {
  const server = app.getHttpServer();
  return {
    get: (path: string) =>
      request(server).get(path).set('Authorization', `Bearer ${userId}`),
    post: (path: string, body: object = {}) =>
      request(server)
        .post(path)
        .set('Authorization', `Bearer ${userId}`)
        .send(body),
    patch: (path: string, body: object) =>
      request(server)
        .patch(path)
        .set('Authorization', `Bearer ${userId}`)
        .send(body),
    delete: (path: string) =>
      request(server).delete(path).set('Authorization', `Bearer ${userId}`),
  };
}

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the public health check without auth', async () => {
    await request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('serves the JSON health endpoint without auth', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('rejects protected routes without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/projects').expect(401);
  });

  it('runs the full login -> CRUD -> reports journey for a single user', async () => {
    const api = authedClient(app, 'user_1');

    const client = await api
      .post('/api/clients', { name: 'Acme Corp', email: 'billing@acme.test' })
      .expect(201);
    const clientId = client.body.data.id as string;

    const project = await api
      .post('/api/projects', {
        name: 'Website redesign',
        clientId,
        status: 'active',
      })
      .expect(201);
    const projectId = project.body.data.id as string;

    await api
      .post(`/api/projects/${projectId}/income`, {
        amount: 3000,
        date: '2026-06-01',
        status: 'paid',
      })
      .expect(201);
    await api
      .post(`/api/projects/${projectId}/income`, {
        amount: 1500,
        date: '2026-06-15',
        status: 'pending',
      })
      .expect(201);
    const expense = await api
      .post(`/api/projects/${projectId}/expenses`, {
        amount: 200,
        category: 'hosting',
        date: '2026-06-05',
      })
      .expect(201);

    const detail = await api.get(`/api/projects/${projectId}`).expect(200);
    expect(detail.body.data.totals).toEqual({
      income: 4500,
      expenses: 200,
      profit: 4300,
    });

    const summary = await api.get('/api/dashboard/summary').expect(200);
    expect(summary.body.data).toMatchObject({
      totalRevenue: 4500,
      totalExpenses: 200,
      netProfit: 4300,
      activeProjects: 1,
      completedProjects: 0,
    });

    const monthly = await api
      .get('/api/reports/monthly?month=2026-06')
      .expect(200);
    expect(monthly.body.data).toEqual({
      month: '2026-06',
      revenue: 4500,
      expenses: 200,
      profit: 4300,
    });

    const profitability = await api
      .get('/api/reports/profitability')
      .expect(200);
    expect(profitability.body.data).toEqual([
      {
        projectId,
        name: 'Website redesign',
        income: 4500,
        expenses: 200,
        profit: 4300,
        margin: 4300 / 4500,
      },
    ]);

    const expenseBreakdown = await api.get('/api/reports/expenses').expect(200);
    expect(expenseBreakdown.body.data).toEqual([
      { category: 'hosting', total: 200 },
    ]);

    const revenueBreakdown = await api.get('/api/reports/revenue').expect(200);
    expect(revenueBreakdown.body.data).toEqual([
      { clientId, clientName: 'Acme Corp', total: 4500 },
    ]);

    const updated = await api
      .patch(`/api/projects/${projectId}`, { status: 'completed' })
      .expect(200);
    expect(updated.body.data.status).toBe('completed');

    await api.delete(`/api/expenses/${expense.body.data.id}`).expect(200);
    const detailAfterDelete = await api
      .get(`/api/projects/${projectId}`)
      .expect(200);
    expect(detailAfterDelete.body.data.totals.expenses).toBe(0);

    await api.post(`/api/projects/${projectId}/archive`).expect(201);
    const projectList = await api.get('/api/projects').expect(200);
    expect(projectList.body.data).toEqual([]);
  });

  it("keeps each user's data isolated from other users", async () => {
    const owner = authedClient(app, 'user_owner');
    const stranger = authedClient(app, 'user_stranger');

    const project = await owner
      .post('/api/projects', { name: 'Private project' })
      .expect(201);
    const projectId = project.body.data.id as string;

    const strangerView = await stranger
      .get(`/api/projects/${projectId}`)
      .expect(200);
    expect(strangerView.body.data).toBeNull();

    const strangerList = await stranger.get('/api/projects').expect(200);
    expect(strangerList.body.data).toEqual([]);
  });
});
