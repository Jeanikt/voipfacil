// src/services/fallback.service.ts
import prisma from '../config/database';
import logger from '../config/logger';
import asteriskService from './asterisk.service';

interface FallbackCallParams {
  to: string;
  from: string;
  trunks: any[];
  options: {
    recordCall: boolean;
    enableTranscription: boolean;
    enableSentimentAnalysis: boolean;
    script?: string | null;
    webhookUrl?: string | null;
    metadata?: Record<string, any> | null;
  };
}

class FallbackService {
  async makeCallWithFallback(params: FallbackCallParams): Promise<any> {
    const { to, from, trunks, options } = params;

    let lastError: string = '';

    // Tentar cada tronco na ordem de prioridade
    for (const trunk of trunks) {
      try {
        logger.info(`🔄 Tentando tronco: ${trunk.name}`, {
          trunkId: trunk.id,
          priority: trunk.priority,
        });

        // Verificar se o tronco não excedeu o limite de canais
        if (trunk.currentCalls >= trunk.maxChannels) {
          logger.warn(`📊 Tronco ${trunk.name} atingiu limite de canais`, {
            current: trunk.currentCalls,
            max: trunk.maxChannels,
          });
          lastError = `Limite de canais atingido (${trunk.currentCalls}/${trunk.maxChannels})`;
          continue;
        }

        const result = await asteriskService.makeCall(from, to, trunk.name);

        if (result.success) {
          logger.info(`✅ Chamada realizada com sucesso via ${trunk.name}`, {
            trunkId: trunk.id,
            uniqueId: result.uniqueid,
          });

          // Calcular custo estimado baseado nas tarifas do provedor
          const cost = await this.estimateCallCost(trunk, 60); // Estimativa de 1 minuto

          return {
            success: true,
            trunkId: trunk.id,
            uniqueid: result.uniqueid,
            cost,
            duration: 0, // Será atualizado quando a chamada terminar
            recordingUrl:
              options.recordCall && result.uniqueid ? this.generateRecordingUrl(result.uniqueid) : null,
            transcription:
              options.enableTranscription && result.uniqueid
                ? await this.transcribeCall(result.uniqueid)
                : null,
            sentiment:
              options.enableSentimentAnalysis && result.uniqueid
                ? await this.analyzeSentiment(result.uniqueid)
                : null,
          };
        }

        lastError = result.error || 'Erro desconhecido no tronco';

        // Atualizar estatísticas de falha
        await this.recordTrunkFailure(trunk.id, lastError);
      } catch (error: any) {
        lastError = error.message;
        logger.warn(`❌ Falha no tronco ${trunk.name}:`, {
          error: error.message,
          trunkId: trunk.id,
        });

        await this.recordTrunkFailure(trunk.id, error.message);
      }
    }

    logger.error('❌ Todos os troncos falharam', {
      lastError,
      trunksAttempted: trunks.length,
    });

    return {
      success: false,
      error: `Falha em ${trunks.length} troncos: ${lastError}`,
      trunkId: null,
    };
  }

  private async estimateCallCost(trunk: any, estimatedDuration: number): Promise<number> {
    try {
      // Buscar informações do provedor para cálculo de custo
      if (trunk.provider) {
        const provider = await prisma.provider.findFirst({
          where: {
            name: trunk.provider,
            isActive: true,
          },
        });

        if (provider) {
          // Usar tarifa móvel como padrão, média entre fixo e móvel
          const tarifa = (provider.tarifaFixo + provider.tarifaMovel) / 2;
          return (estimatedDuration / 60) * tarifa;
        }
      }

      // Tarifa padrão caso não encontre o provedor
      return (estimatedDuration / 60) * 0.1;
    } catch (error) {
      logger.warn('❌ Erro ao estimar custo da chamada, usando valor padrão:', error);
      return (estimatedDuration / 60) * 0.1;
    }
  }

  private async recordTrunkFailure(trunkId: string, error: string): Promise<void> {
    try {
      await prisma.trunk.update({
        where: { id: trunkId },
        data: {
          failedCalls: { increment: 1 },
          lastError: error,
          lastErrorAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('❌ Erro ao registrar falha do tronco:', error);
    }
  }

  private generateRecordingUrl(uniqueId: string): string {
    return `/recordings/${uniqueId}.wav`;
  }

  private async transcribeCall(_uniqueId: string): Promise<string | null> {
    // Implementação real com Whisper API
    try {
      // TODO: Integrar com OpenAI Whisper
      return null;
    } catch (error) {
      logger.error('❌ Erro na transcrição:', error);
      return null;
    }
  }

  private async analyzeSentiment(_uniqueId: string): Promise<string | null> {
    // Implementação real com HuggingFace
    try {
      // TODO: Integrar com HuggingFace
      return null;
    } catch (error) {
      logger.error('❌ Erro na análise de sentimento:', error);
      return null;
    }
  }

  async getFallbackStatistics(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await prisma.trunk.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        totalCalls: true,
        failedCalls: true,
        lastError: true,
        lastErrorAt: true,
        calls: {
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            status: true,
            cost: true,
          },
        },
      },
    });

    return stats.map((trunk) => {
      const successfulCalls = trunk.calls.filter((call: any) => call.status === 'COMPLETED').length;
      const totalCalls = trunk.calls.length;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      return {
        ...trunk,
        successRate,
        totalCallsLast30Days: totalCalls,
        successfulCallsLast30Days: successfulCalls,
      };
    });
  }
}

export const fallbackService = new FallbackService();
