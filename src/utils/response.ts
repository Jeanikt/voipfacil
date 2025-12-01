// src/utils/response.ts
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: string, statusCode: number = 500): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };

  res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): void => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      pages: Math.ceil(pagination.total / pagination.limit),
    },
  };

  if (message) {
    response.message = message;
  }

  res.json(response);
};
