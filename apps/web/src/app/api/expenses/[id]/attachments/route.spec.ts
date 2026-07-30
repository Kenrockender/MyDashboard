import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/attachments/attachments.service', () => ({
  attachmentsService: { create: jest.fn(), findAllForExpense: jest.fn(), remove: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { attachmentsService } from '@/server/attachments/attachments.service';
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockAttachmentsService = attachmentsService as jest.Mocked<typeof attachmentsService>;

describe('POST /api/expenses/[id]/attachments', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created attachment wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockAttachmentsService.create.mockResolvedValue({
      id: 'attachment_1',
      userId: 'user_1',
      expenseId: 'expense_1',
      projectId: 'project_1',
      filename: 'receipt.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      dataBase64: 'ZmFrZQ==',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/expenses/expense_1/attachments', {
      method: 'POST',
      body: JSON.stringify({ filename: 'receipt.png', mimeType: 'image/png', dataBase64: 'ZmFrZQ==' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.filename).toBe('receipt.png');
    expect(mockAttachmentsService.create).toHaveBeenCalledWith('user_1', 'expense_1', {
      filename: 'receipt.png',
      mimeType: 'image/png',
      dataBase64: 'ZmFrZQ==',
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/expenses/expense_1/attachments', {
      method: 'POST',
      body: JSON.stringify({ filename: 'receipt.png', mimeType: 'image/png', dataBase64: 'ZmFrZQ==' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockAttachmentsService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/expenses/expense_1/attachments', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'expense_1' }) });

    expect(res.status).toBe(400);
    expect(mockAttachmentsService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/expenses/[id]/attachments', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockAttachmentsService.findAllForExpense.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/expenses/expense_1/attachments');
    const res = await GET(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockAttachmentsService.findAllForExpense).toHaveBeenCalledWith('user_1', 'expense_1');
  });
});
