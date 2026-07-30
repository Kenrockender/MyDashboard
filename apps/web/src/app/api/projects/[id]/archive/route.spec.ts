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
import { POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockProjectsService = projectsService as jest.Mocked<typeof projectsService>;

describe('POST /api/projects/[id]/archive', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the archived project wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockProjectsService.archive.mockResolvedValue({
      id: 'project_1',
      userId: 'user_1',
      name: 'Website Revamp',
      status: 'completed',
      dealType: 'ongoing',
      archived: true,
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects/project_1/archive', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.archived).toBe(true);
    expect(mockProjectsService.archive).toHaveBeenCalledWith('user_1', 'project_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1/archive', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockProjectsService.archive).not.toHaveBeenCalled();
  });
});
