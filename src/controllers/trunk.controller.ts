// src/controllers/trunk.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { trunkTestService } from '../services/trunk-test.service';
import { createTrunkSchema, updateTrunkSchema } from '../models/trunk.model';

class TrunkController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createTrunkSchema.parse(req.body);
      const {
        name,
        sipUri,
        sipUsername,
        sipPassword,
        provider = 'Custom',
        isPrimary = false,
        priority = 0,
        maxChannels = 5,
      } = validatedData;

      // Validar SIP URI
      if (!sipUri.startsWith('sip:')) {
        res.status(400).json({
          success: false,
          error: 'SIP URI deve começar com "sip:"',
        });
        return;
      }

      // Se for primary, desmarcar outros troncos como primary
      if (isPrimary) {
        await prisma.trunk.updateMany({
          where: {
            userId: (req.user as any).id,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      const trunk = await prisma.trunk.create({
        data: {
          userId: (req.user as any).id,
          name,
          sipUri,
          sipUsername,
          sipPassword,
          provider,
          isPrimary,
          priority,
          maxChannels,
          isActive: true,
        },
      });

      // Log de auditoria
      await prisma.auditLog.create({
        data: {
          userId: (req.user as any).id,
          action: 'CREATE_TRUNK',
          resource: 'trunk',
          resourceId: trunk.id,
          details: {
            name,
            provider,
            isPrimary,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });

      logger.info('✅ Tronco criado', {
        trunkId: trunk.id,
        userId: (req.user as any).id,
      });

      res.status(201).json({
        success: true,
        data: trunk,
        message: 'Tronco criado com sucesso',
      });
    } catch (error: any) {
      logger.error('❌ Erro ao criar tronco:', error);

      if (error.errors) {
        res.status(400).json({
          success: false,
          error: error.errors[0].message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao criar tronco',
        });
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const trunks = await prisma.trunk.findMany({
        where: { userId: (req.user as any).id },
        orderBy: [{ isPrimary: 'desc' }, { priority: 'desc' }, { createdAt: 'asc' }],
        include: {
          _count: {
            select: {
              calls: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: trunks,
        total: trunks.length,
      });
    } catch (error) {
      logger.error('❌ Erro ao buscar troncos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar troncos',
      });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const trunk = await prisma.trunk.findFirst({
        where: {
          id,
          userId: (req.user as any).id,
        },
        include: {
          calls: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              from: true,
              to: true,
              status: true,
              duration: true,
              cost: true,
              createdAt: true,
            },
          },
        },
      });

      if (!trunk) {
        res.status(404).json({
          success: false,
          error: 'Tronco não encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: trunk,
      });
    } catch (error) {
      logger.error('❌ Erro ao buscar tronco:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar tronco',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateTrunkSchema.parse(req.body);

      // Verificar se o tronco existe e pertence ao usuário
      const existingTrunk = await prisma.trunk.findFirst({
        where: {
          id,
          userId: (req.user as any).id,
        },
      });

      if (!existingTrunk) {
        res.status(404).json({
          success: false,
          error: 'Tronco não encontrado',
        });
        return;
      }

      // Se for primary, desmarcar outros troncos
      if (validatedData.isPrimary) {
        await prisma.trunk.updateMany({
          where: {
            userId: (req.user as any).id,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      const trunk = await prisma.trunk.update({
        where: { id },
        data: validatedData,
      });

      logger.info('✅ Tronco atualizado', { trunkId: trunk.id });

      res.json({
        success: true,
        data: trunk,
        message: 'Tronco atualizado com sucesso',
      });
    } catch (error: any) {
      logger.error('❌ Erro ao atualizar tronco:', error);

      if (error.errors) {
        res.status(400).json({
          success: false,
          error: error.errors[0].message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao atualizar tronco',
        });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar se o tronco existe e pertence ao usuário
      const trunk = await prisma.trunk.findFirst({
        where: {
          id,
          userId: (req.user as any).id,
        },
      });

      if (!trunk) {
        res.status(404).json({
          success: false,
          error: 'Tronco não encontrado',
        });
        return;
      }

      // Verificar se existem chamadas ativas
      const activeCalls = await prisma.call.count({
        where: {
          trunkId: id,
          status: { in: ['INITIATED', 'RINGING', 'ANSWERED'] },
        },
      });

      if (activeCalls > 0) {
        res.status(400).json({
          success: false,
          error: 'Não é possível deletar tronco com chamadas ativas',
        });
        return;
      }

      await prisma.trunk.delete({
        where: { id },
      });

      logger.info('✅ Tronco deletado', { trunkId: id });

      res.json({
        success: true,
        message: 'Tronco deletado com sucesso',
      });
    } catch (error: any) {
      logger.error('❌ Erro ao deletar tronco:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao deletar tronco',
      });
    }
  }

  async test(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const trunk = await prisma.trunk.findFirst({
        where: {
          id,
          userId: (req.user as any).id,
        },
      });

      if (!trunk) {
        res.status(404).json({
          success: false,
          error: 'Tronco não encontrado',
        });
        return;
      }

      const testResult = await trunkTestService.testTrunk(trunk);

      // Atualizar status do tronco baseado no teste
      await prisma.trunk.update({
        where: { id },
        data: {
          isActive: testResult.success,
          lastTestedAt: new Date(),
          lastError: testResult.error || null,
          lastErrorAt: testResult.error ? new Date() : null,
        },
      });

      // Log de auditoria
      await prisma.auditLog.create({
        data: {
          userId: (req.user as any).id,
          action: 'TEST_TRUNK',
          resource: 'trunk',
          resourceId: trunk.id,
          details: JSON.parse(JSON.stringify(testResult)),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });

      res.json({
        success: testResult.success,
        data: testResult,
        message: testResult.success ? 'Tronco testado com sucesso' : testResult.error,
      });
    } catch (error: any) {
      logger.error('❌ Erro ao testar tronco:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao testar tronco',
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const trunk = await prisma.trunk.findFirst({
        where: {
          id,
          userId: (req.user as any).id,
        },
      });

      if (!trunk) {
        res.status(404).json({
          success: false,
          error: 'Tronco não encontrado',
        });
        return;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [callStats, dailyStats, statusStats] = await Promise.all([
        // Estatísticas gerais
        prisma.call.aggregate({
          where: {
            trunkId: id,
            createdAt: { gte: thirtyDaysAgo },
          },
          _count: { id: true },
          _sum: {
            cost: true,
            duration: true,
          },
          _avg: { duration: true },
        }),

        // Estatísticas diárias (últimos 7 dias)
        prisma.call.groupBy({
          by: ['createdAt'],
          where: {
            trunkId: id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          _count: { id: true },
          _sum: { duration: true, cost: true },
          orderBy: { createdAt: 'asc' },
        }),

        // Estatísticas por status
        prisma.call.groupBy({
          by: ['status'],
          where: {
            trunkId: id,
            createdAt: { gte: thirtyDaysAgo },
          },
          _count: { id: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalCalls: callStats._count?.id ?? 0,
            totalCost: callStats._sum?.cost ?? 0,
            totalDuration: callStats._sum?.duration ?? 0,
            averageDuration: callStats._avg?.duration ?? 0,
          },
          daily: dailyStats,
          byStatus: statusStats,
          trunk: {
            name: trunk.name,
            provider: trunk.provider,
            isActive: trunk.isActive,
            totalCalls: trunk.totalCalls,
            failedCalls: trunk.failedCalls,
            successRate:
              trunk.totalCalls > 0
                ? ((trunk.totalCalls - trunk.failedCalls) / trunk.totalCalls) * 100
                : 0,
          },
        },
      });
    } catch (error) {
      logger.error('❌ Erro ao buscar estatísticas do tronco:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas',
      });
    }
  }
}

export default new TrunkController();
