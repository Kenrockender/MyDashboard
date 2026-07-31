import { NextRequest } from 'next/server';
import { BadRequestException } from '@nestjs/common';
import { ok, withRoute } from './respond';

function makeRequest(ip: string, path = '/api/test') {
  return new NextRequest(`http://localhost${path}`, {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('ok', () => {
  it('wraps data in the { data } envelope with a 200 status by default', async () => {
    const res = ok({ id: '1' });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ data: { id: '1' } });
  });

  it('accepts a custom status', async () => {
    const res = ok({ id: '1' }, { status: 201 });
    expect(res.status).toBe(201);
  });
});

describe('withRoute error handling', () => {
  it('maps a thrown HttpException to the { error } envelope with its status', async () => {
    const req = makeRequest('203.0.113.1');
    const res = await withRoute(req, async () => {
      throw new BadRequestException('Nope');
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.statusCode).toBe(400);
    expect(json.error.message).toBe('Nope');
    expect(json.error.path).toBe('/api/test');
  });

  it('maps an unexpected error to 500 without leaking its message', async () => {
    const req = makeRequest('203.0.113.2');
    const res = await withRoute(req, async () => {
      throw new Error('database password is hunter2');
    });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe('Internal server error');
  });

  it("returns the handler's response untouched on success", async () => {
    const req = makeRequest('203.0.113.3');
    const res = await withRoute(req, async () => ok({ ok: true }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ data: { ok: true } });
  });
});

// Each test below uses its own IP (TEST-NET-2, 198.51.100.0/24) since the
// rate limiter's bucket map is a module-level singleton shared across every
// test in this file — reusing an IP would leak count between tests.
describe('withRoute rate limiting', () => {
  it('allows a request under the per-IP limit', async () => {
    const res = await withRoute(makeRequest('198.51.100.10'), async () => ok({}));
    expect(res.status).toBe(200);
  });

  it('rejects the 121st request from the same IP within the window with 429', async () => {
    const ip = '198.51.100.20';
    let last;
    for (let i = 0; i < 121; i++) {
      last = await withRoute(makeRequest(ip), async () => ok({}));
    }

    expect(last!.status).toBe(429);
    const json = await last!.json();
    expect(json.error.message).toBe('Too many requests');
  });

  it('tracks separate buckets per IP, so one busy IP does not throttle another', async () => {
    const busyIp = '198.51.100.30';
    for (let i = 0; i < 120; i++) {
      await withRoute(makeRequest(busyIp), async () => ok({}));
    }
    const limited = await withRoute(makeRequest(busyIp), async () => ok({}));
    expect(limited.status).toBe(429);

    const otherIp = '198.51.100.31';
    const unaffected = await withRoute(makeRequest(otherIp), async () => ok({}));
    expect(unaffected.status).toBe(200);
  });

  it('resets the bucket once the window has elapsed', async () => {
    const ip = '198.51.100.40';
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now());

    for (let i = 0; i < 120; i++) {
      await withRoute(makeRequest(ip), async () => ok({}));
    }
    const limited = await withRoute(makeRequest(ip), async () => ok({}));
    expect(limited.status).toBe(429);

    nowSpy.mockReturnValue(nowSpy.mock.results[0].value + 60_001);
    const afterWindow = await withRoute(makeRequest(ip), async () => ok({}));
    expect(afterWindow.status).toBe(200);

    nowSpy.mockRestore();
  });

  it('falls back to x-real-ip, then to a shared "unknown" bucket, when x-forwarded-for is absent', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-real-ip': '198.51.100.50' },
    });
    const res = await withRoute(req, async () => ok({}));
    expect(res.status).toBe(200);
  });
});
