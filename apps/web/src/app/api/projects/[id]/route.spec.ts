import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/projects/projects.service', () => ({
  projectsService: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  },
}));

import { requireUser } from '@/server/require-user';
import { projectsService } from '@/server/projects/projects.service';
import { GET, PATCH } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockProjectsService = projectsService as jest.Mocked<typeof projectsService>;

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the project wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockProjectsService.findOne.mockResolvedValue({
      id: 'project_1',
      userId: 'user_1',
      name: 'Website Revamp',
      client: null,
      income: [],
      expenses: [],
      totals: [],
    } as never);

    const req = new NextRequest('http://localhost/api/projects/project_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe('project_1');
    expect(mockProjectsService.findOne).toHaveBeenCalledWith('user_1', 'project_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockProjectsService.findOne).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/projects/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated project wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockProjectsService.update.mockResolvedValue({
      id: 'project_1',
      userId: 'user_1',
      name: 'Renamed Project',
      status: 'active',
      dealType: 'ongoing',
      archived: false,
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects/project_1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed Project' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe('Renamed Project');
    expect(mockProjectsService.update).toHaveBeenCalledWith('user_1', 'project_1', {
      name: 'Renamed Project',
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed Project' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockProjectsService.update).not.toHaveBeenCalled();
  });

  it('rejects a PATCH body with fields outside the DTO whitelist with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/projects/project_1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed Project', userId: 'attacker-uid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.statusCode).toBe(400);
    expect(mockProjectsService.update).not.toHaveBeenCalled();
  });
});
