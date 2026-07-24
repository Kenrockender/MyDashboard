import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Catches every unhandled error thrown anywhere in the request lifecycle and
 * turns it into a consistent JSON error envelope, while logging it in a
 * structured, greppable form. This is the single place server-side errors are
 * observed — it is also the natural hook point for an external error tracker
 * (e.g. Sentry): if SENTRY_DSN is set, forward `exception` from here.
 *
 * Response shape (matches the `{ data }` success envelope used elsewhere):
 *   { "error": { "statusCode": 500, "message": "...", "path": "/api/..." } }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    // 5xx are real defects worth alerting on; 4xx are expected client errors.
    const logLine = `${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`;
    if (status >= 500) {
      this.logger.error(
        logLine,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logLine);
    }

    response.status(status).json({
      error: {
        statusCode: status,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private extractMessage(exception: unknown): string | string[] {
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
}
