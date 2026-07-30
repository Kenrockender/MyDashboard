import { GET } from './route';

describe('GET /api/health', () => {
  it('returns an ok status with uptime and timestamp', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(typeof json.uptime).toBe('number');
    expect(typeof json.timestamp).toBe('string');
  });
});
