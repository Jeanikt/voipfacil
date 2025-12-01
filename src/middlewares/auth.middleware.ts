// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '@/config/database';
import logger from '@/config/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  apiKey: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  googleId?: string | null;
  lgpdConsent?: boolean;
  lgpdConsentDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verificar autenticação via session (Google OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Verificar API Key no header
    const apiKey = req.header('x-api-key') || req.header('authorization')?.replace('Bearer ', '');

    if (apiKey) {
      const user = await prisma.user.findUnique({
        where: {
          apiKey,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          apiKey: true,
          isActive: true,
          lastLoginAt: true,
          googleId: true,
          lgpdConsent: true,
          lgpdConsentDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (user) {
        req.user = user;

        // Atualizar último acesso (máximo uma vez por hora)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (!user.lastLoginAt || user.lastLoginAt < oneHourAgo) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }

        return next();
      }
    }

    // Não autenticado
    res.status(401).json({
      success: false,
      error: 'Não autenticado. Faça login ou forneça uma API Key válida.',
    });
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verificar autenticação via session
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Verificar API Key
    const apiKey = req.header('x-api-key') || req.header('authorization')?.replace('Bearer ', '');

    if (apiKey) {
      const user = await prisma.user.findUnique({
        where: {
          apiKey,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          apiKey: true,
          isActive: true,
          lastLoginAt: true,
          googleId: true,
          lgpdConsent: true,
          lgpdConsentDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Em auth opcional, apenas seguimos mesmo com erro
    next();
  }
};
