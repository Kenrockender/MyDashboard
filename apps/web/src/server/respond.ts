import { HttpException, HttpStatus } from '@nestjs/common';
import { NextResponse, type NextRequest } from 'next/server';

export function ok<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ data }, { status: init?.status ?? 200 });
}

function extractMessage(exception: unknown): string | string[] {
  if (exception instanceof HttpException) {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    if (res && typeof res === 'object' && 'message' in res) {
      return (res as { message: string | string[] }).message;
    }
    return exception.message;
  }
  // Never leak internal error details for unexpected exceptions.
  return 'Internal server error';
}

// Same 120 req/min/IP floor as the NestJS ThrottlerModule config. This is a
// per-instance in-memory counter, so on serverless it's a floor, not a hard
// cap — each cold instance gets its own bucket. Documented behavior carried
// over as-is, not a regression introduced by the merge.
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function checkRateLimit(req: NextRequest): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT;
}

/**
 * Wraps a Route Handler body: enforces the rate limit, catches thrown
 * exceptions, and maps them to the `{ error }` envelope (mirrors NestJS's
 * AllExceptionsFilter). 5xx are logged as errors (worth alerting on), 4xx as
 * warnings (expected client errors). `Response` (not just `NextResponse`) is
 * accepted so PDF routes can return a raw binary Response.
 */
export function withRoute(req: NextRequest, handler: () => Promise<Response>): Promise<Response> {
  return runRoute(req, handler);
}

async function runRoute(req: NextRequest, handler: () => Promise<Response>): Promise<Response> {
  if (!checkRateLimit(req)) {
    return errorResponse(req, new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS));
  }

  try {
    return await handler();
  } catch (exception) {
    return errorResponse(req, exception);
  }
}

function errorResponse(req: NextRequest, exception: unknown): NextResponse {
  const status =
    exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
  const message = extractMessage(exception);
  const path = req.nextUrl.pathname;

  const logLine = `${req.method} ${path} -> ${status} ${JSON.stringify(message)}`;
  if (status >= 500) {
    console.error(logLine, exception instanceof Error ? exception.stack : undefined);
  } else {
    console.warn(logLine);
  }

  return NextResponse.json(
    { error: { statusCode: status, message, path, timestamp: new Date().toISOString() } },
    { status },
  );
}
