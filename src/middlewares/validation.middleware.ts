// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '@/config/logger';
import { formatZodError } from '@/utils/validation.util';

export const validate = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      req[source] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Erro de validação:', {
          errors: error.errors,
          path: req.path,
          method: req.method,
        });

        res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          details: formatZodError(error),
        });
        return;
      }

      next(error);
    }
  };
};

export const validateParams = (schema: AnyZodObject) => validate(schema, 'params');
export const validateQuery = (schema: AnyZodObject) => validate(schema, 'query');
export const validateBody = (schema: AnyZodObject) => validate(schema, 'body');
