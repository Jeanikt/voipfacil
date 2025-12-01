// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { generateApiKey } from '../utils/security';
import { updateUserSchema } from '../models/user.model';

class AuthController {
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.redirect(`${process.env.APP_URL}/login?error=auth_failed`);
        return;
      }

      const user = req.user as any;

      // Atualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      logger.info('✅ Login Google realizado', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          apiKey: user.apiKey,
        },
      });
    } catch (error) {
      logger.error('❌ Erro no callback Google:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao processar login',
      });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: (req.user as any).id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          apiKey: true,
          isActive: true,
          lgpdConsent: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('❌ Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar usuário',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      req.logout((err) => {
        if (err) {
          throw err;
        }

        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            logger.error('❌ Erro ao destruir sessão:', sessionErr);
          }

          res.clearCookie('connect.sid');
          res.json({
            success: true,
            message: 'Logout realizado com sucesso',
          });
        });
      });
    } catch (error) {
      logger.error('❌ Erro no logout:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao fazer logout',
      });
    }
  }

  async regenerateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const newApiKey = generateApiKey();

      const user = await prisma.user.update({
        where: { id: (req.user as any).id },
        data: { apiKey: newApiKey },
        select: {
          id: true,
          email: true,
          name: true,
          apiKey: true,
        },
      });

      // Log de auditoria
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGENERATE_API_KEY',
          resource: 'user',
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });

      logger.info('🔑 API Key regenerada', { userId: user.id });

      res.json({
        success: true,
        data: { apiKey: user.apiKey },
        message: 'API Key regenerada com sucesso',
      });
    } catch (error) {
      logger.error('❌ Erro ao regenerar API Key:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao regenerar API Key',
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateUserSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: (req.user as any).id },
        data: validatedData,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: user,
        message: 'Perfil atualizado com sucesso',
      });
    } catch (error: any) {
      logger.error('❌ Erro ao atualizar perfil:', error);
      res.status(400).json({
        success: false,
        error: error.errors?.[0]?.message || 'Erro ao atualizar perfil',
      });
    }
  }
}

export default new AuthController();
