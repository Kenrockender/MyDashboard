import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/tax/tax.service', () => ({
  taxService: { getPphUmkmEstimate: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { taxService } from '@/server/tax/tax.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockTaxService = taxService as jest.Mocked<typeof taxService>;

describe('GET /api/tax/pph-umkm', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('passes the ?year query param through as a number', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTaxService.getPphUmkmEstimate.mockResolvedValue({} as never);

    const req = new NextRequest('http://localhost/api/tax/pph-umkm?year=2024');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({});
    expect(mockTaxService.getPphUmkmEstimate).toHaveBeenCalledWith('user_1', 2024);
  });

  it('defaults to the current year when ?year is omitted', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTaxService.getPphUmkmEstimate.mockResolvedValue({} as never);

    const req = new NextRequest('http://localhost/api/tax/pph-umkm');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockTaxService.getPphUmkmEstimate).toHaveBeenCalledWith(
      'user_1',
      new Date().getUTCFullYear(),
    );
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/tax/pph-umkm');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockTaxService.getPphUmkmEstimate).not.toHaveBeenCalled();
  });
});
