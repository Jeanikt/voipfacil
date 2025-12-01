// src/controllers/call.controller.ts
import { Request, Response } from 'express';
import prisma from '@/config/database';
import asteriskService from '@/services/asterisk.service';
import { fallbackService } from '@/services/fallback.service';
import { initiateCallSchema, updateCallSchema, callQuerySchema } from '@/models/call.model';
import { asyncHandler, AppError } from '@/middlewares/error.middleware';

class CallController {
  initiate = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = initiateCallSchema.parse(req.body);
    const {
      to,
      from,
      recordCall = true,
      enableTranscription = false,
      enableSentimentAnalysis = false,
      trunkId,
      script,
      webhookUrl,
      metadata,
    } = validatedData;

    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    // Buscar troncos ativos do usuário
    let trunks;
    if (trunkId) {
      const trunk = await prisma.trunk.findFirst({
        where: {
          id: trunkId,
          userId: req.user.id,
          isActive: true,
        },
      });

      if (!trunk) {
        throw new AppError(404, 'Tronco não encontrado ou inativo');
      }
      trunks = [trunk];
    } else {
      trunks = await prisma.trunk.findMany({
        where: {
          userId: req.user.id,
          isActive: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { priority: 'desc' }],
      });
    }

    if (trunks.length === 0) {
      throw new AppError(400, 'Nenhum tronco configurado. Configure um tronco SIP primeiro.');
    }

    // Usar serviço de fallback para tentar a chamada
        const result = await fallbackService.makeCallWithFallback({
          to,
          from: from || trunks[0]!.sipUsername,
          trunks,
          options: {
            recordCall,
            enableTranscription,
            enableSentimentAnalysis,
            script,
            webhookUrl,
            metadata,
          },
        });

    // Salvar chamada no banco
    const call = await prisma.call.create({
      data: {
        userId: req.user.id,
        trunkId: result.trunkId!,
        from: from || trunks[0]!.sipUsername,
        to,
        externalId: result.uniqueid,
        status: result.success ? 'INITIATED' : 'FAILED',
        cost: result.cost || 0,
        duration: result.duration,
        recordingUrl: result.recordingUrl,
        transcription: result.transcription,
        sentiment: result.sentiment,
        errorMessage: result.error,
        metadata: result.metadata,
      },
      include: {
        trunk: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    // Atualizar estatísticas do tronco
    if (result.trunkId) {
      await prisma.trunk.update({
        where: { id: result.trunkId },
        data: {
          totalCalls: { increment: 1 },
          ...(result.success
            ? { currentCalls: { increment: 1 } }
            : { failedCalls: { increment: 1 } }),
        },
      });
    }

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'INITIATE_CALL',
        resource: 'call',
        resourceId: call.id,
        details: {
          to,
          from: from || trunks[0]!.sipUsername,
          success: result.success,
          trunkUsed: result.trunkId,
          cost: result.cost,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({
      success: result.success,
      data: call,
      message: result.success ? 'Chamada iniciada com sucesso' : result.error,
    });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const validatedQuery = callQuerySchema.parse(req.query);
    const { page, limit, status, from, to, startDate, endDate, trunkId } = validatedQuery;

    const where: any = {
      userId: req.user.id,
    };

    if (status) where.status = status;
    if (from) where.from = { contains: from };
    if (to) where.to = { contains: to };
    if (trunkId) where.trunkId = trunkId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          trunk: {
            select: {
              id: true,
              name: true,
              provider: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.call.count({ where }),
    ]);

    res.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const { id } = req.params;

    const call = await prisma.call.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        trunk: {
          select: {
            id: true,
            name: true,
            provider: true,
            sipUri: true,
          },
        },
      },
    });

    if (!call) {
      throw new AppError(404, 'Chamada não encontrada');
    }

    res.json({
      success: true,
      data: call,
    });
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const { startDate, endDate } = callQuerySchema.parse(req.query);

    const where: any = {
      userId: req.user.id,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [statusStats, totalCalls, totalCost, totalDuration, trunkStats] = await Promise.all([
      prisma.call.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { cost: true, duration: true },
      }),

      prisma.call.count({ where }),

      prisma.call.aggregate({
        where,
        _sum: { cost: true },
      }),

      prisma.call.aggregate({
        where,
        _sum: { duration: true },
      }),

      prisma.call.groupBy({
        by: ['trunkId'],
        where,
        _count: { id: true },
        _sum: { cost: true, duration: true },
      }),
    ]);

    const trunkDetails = await Promise.all(
      trunkStats.map(async (stat) => {
        const trunk = await prisma.trunk.findUnique({
          where: { id: stat.trunkId },
          select: { name: true, provider: true },
        });
        return {
          ...stat,
          trunkName: trunk?.name,
          trunkProvider: trunk?.provider,
        };
      })
    );

    res.json({
      success: true,
      data: {
        byStatus: statusStats,
        byTrunk: trunkDetails,
        totals: {
          calls: totalCalls,
          cost: totalCost._sum.cost || 0,
          duration: totalDuration._sum.duration || 0,
        },
      },
    });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const { id } = req.params;
    const validatedData = updateCallSchema.parse(req.body);

    const call = await prisma.call.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!call) {
      throw new AppError(404, 'Chamada não encontrada');
    }

    const updatedCall = await prisma.call.update({
      where: { id },
      data: validatedData,
      include: {
        trunk: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedCall,
      message: 'Chamada atualizada com sucesso',
    });
  });

  hangup = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const { id } = req.params;

    const call = await prisma.call.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!call) {
      throw new AppError(404, 'Chamada não encontrada');
    }

    if (call.status === 'COMPLETED' || call.status === 'FAILED') {
      throw new AppError(400, 'Chamada já finalizada');
    }

    if (!call.externalId) {
      throw new AppError(400, 'Chamada não possui ID externo para desligamento');
    }

    const success = await asteriskService.hangup(call.externalId);

    if (success) {
      await prisma.call.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await prisma.trunk.update({
        where: { id: call.trunkId },
        data: { currentCalls: { decrement: 1 } },
      });
    }

    res.json({
      success,
      message: success ? 'Chamada finalizada com sucesso' : 'Erro ao finalizar chamada',
    });
  });
}

export default new CallController();
