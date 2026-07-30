import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/attachments/attachments.service', () => ({
  attachmentsService: { create: jest.fn(), findAllForExpense: jest.fn(), remove: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { attachmentsService } from '@/server/attachments/attachments.service';
import { DELETE } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockAttachmentsService = attachmentsService as jest.Mocked<typeof attachmentsService>;

describe('DELETE /api/attachments/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the removed id wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockAttachmentsService.remove.mockResolvedValue({ id: 'attachment_1' });

    const req = new NextRequest('http://localhost/api/attachments/attachment_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'attachment_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: 'attachment_1' });
    expect(mockAttachmentsService.remove).toHaveBeenCalledWith('user_1', 'attachment_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/attachments/attachment_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'attachment_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockAttachmentsService.remove).not.toHaveBeenCalled();
  });
});
