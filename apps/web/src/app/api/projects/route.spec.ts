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
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockProjectsService = projectsService as jest.Mocked<typeof projectsService>;

describe('POST /api/projects', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created project wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockProjectsService.create.mockResolvedValue({
      id: 'project_1',
      userId: 'user_1',
      name: 'Website Revamp',
      status: 'active',
      dealType: 'ongoing',
      archived: false,
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Website Revamp' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe('Website Revamp');
    expect(mockProjectsService.create).toHaveBeenCalledWith('user_1', { name: 'Website Revamp' });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Website Revamp' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockProjectsService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockProjectsService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the page wrapped in the { data } envelope, passing through query filters', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockProjectsService.findAll.mockResolvedValue({ items: [], nextCursor: null });

    const req = new NextRequest(
      'http://localhost/api/projects?status=active&clientId=client_1&search=web&dealType=ongoing',
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ items: [], nextCursor: null });
    expect(mockProjectsService.findAll).toHaveBeenCalledWith(
      'user_1',
      { status: 'active', clientId: 'client_1', search: 'web', dealType: 'ongoing' },
      { cursor: undefined, limit: undefined },
    );
  });

  it('passes cursor and limit through to the service', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockProjectsService.findAll.mockResolvedValue({ items: [], nextCursor: null });

    const req = new NextRequest('http://localhost/api/projects?cursor=2026-01-01T00:00:00.000Z&limit=10');
    await GET(req);

    expect(mockProjectsService.findAll).toHaveBeenCalledWith(
      'user_1',
      { status: undefined, clientId: undefined, search: undefined, dealType: undefined },
      { cursor: '2026-01-01T00:00:00.000Z', limit: 10 },
    );
  });
});
