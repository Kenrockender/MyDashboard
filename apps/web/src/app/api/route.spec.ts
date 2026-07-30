import { GET } from './route';

describe('GET /api', () => {
  it('returns a 200 with the greeting body', async () => {
    const res = await GET();
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe('Hello World!');
  });
});
