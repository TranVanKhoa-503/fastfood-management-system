import { Request, Response, NextFunction } from 'express';

type ErrorDetails = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
  code?: number;
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const details = err instanceof Error ? err as ErrorDetails : null;
  const isProduction = process.env.NODE_ENV === 'production';
  let statusCode = details?.statusCode ?? details?.status ?? 500;

  if (details?.type === 'entity.too.large') statusCode = 413;
  else if (details?.type === 'entity.parse.failed') statusCode = 400;
  else if (details?.code === 11000) statusCode = 409;
  else if (details?.name === 'ValidationError' || details?.name === 'CastError') statusCode = 400;
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) statusCode = 500;

  if (!isProduction || statusCode >= 500) {
    console.error('[Error Middleware]:', details?.message || 'Unknown error');
  }
  const message = statusCode >= 500 && isProduction
    ? 'Internal server error'
    : details?.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: details?.stack }),
  });
};
