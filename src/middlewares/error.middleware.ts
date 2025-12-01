// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';
import { env } from '@/config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Erro não tratado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req.user as any)?.id,
  });

  // Erro de validação Zod
  if (error.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Dados de entrada inválidos',
      ...(env.NODE_ENV === 'development' && { details: error.message }),
    });
    return;
  }

  // Erros do Prisma
  if (error.name.includes('Prisma')) {
    res.status(500).json({
      success: false,
      error: 'Erro de banco de dados',
      ...(env.NODE_ENV === 'development' && { details: error.message }),
    });
    return;
  }

  // AppError personalizado
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    ...(env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
