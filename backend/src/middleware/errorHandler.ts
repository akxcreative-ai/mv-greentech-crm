import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: details.length > 0 ? details[0].message : 'Validation failed',
      details,
    });
    return;
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        res.status(409).json({
          success: false,
          error: `A record with this ${target} already exists.`,
          code: err.code,
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          success: false,
          error: (err.meta?.cause as string) || 'Record not found.',
          code: err.code,
        });
        return;
      }
      case 'P2003': {
        res.status(400).json({
          success: false,
          error: 'Related record not found or foreign key constraint violation.',
          code: err.code,
        });
        return;
      }
      default: {
        res.status(400).json({
          success: false,
          error: err.message || 'Database operation error.',
          code: err.code,
        });
        return;
      }
    }
  }

  // Handle Prisma Validation Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: 'Invalid database query parameters or payload structure.',
    });
    return;
  }

  // Handle JWT Errors
  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      success: false,
      error: 'Token has expired.',
    });
    return;
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({
      success: false,
      error: 'Invalid token signature or payload.',
    });
    return;
  }

  // Handle standard HTTP / custom errors with status
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('Unhandled Application Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;
