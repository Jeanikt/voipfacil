// src/services/trunk-test.service.ts
import logger from '../config/logger';
import asteriskService from './asterisk.service';

interface TrunkTestResult {
  success: boolean;
  error?: string;
  latency?: number;
  response?: any;
}

class TrunkTestService {
  async testTrunk(trunk: any): Promise<TrunkTestResult> {
    const startTime = Date.now();

    try {
      logger.info(`🧪 Testando tronco: ${trunk.name}`, {
        trunkId: trunk.id,
        sipUri: trunk.sipUri,
      });

      // Teste de conectividade básica
      if (!(await this.testSIPConnectivity(trunk))) {
        return {
          success: false,
          error: 'Falha na conectividade SIP',
          latency: Date.now() - startTime,
        };
      }

      // Teste de registro SIP (se aplicável)
      const registerTest = await this.testSIPRegistration(trunk);
      if (!registerTest.success) {
        return {
          ...registerTest,
          latency: Date.now() - startTime,
        };
      }

      const latency = Date.now() - startTime;

      logger.info(`✅ Tronco testado com sucesso: ${trunk.name}`, {
        trunkId: trunk.id,
        latency,
      });

      return {
        success: true,
        latency,
        response: {
          sipConnectivity: true,
          sipRegistration: registerTest.success,
          latency,
        },
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      logger.error(`❌ Erro ao testar tronco ${trunk.name}:`, {
        error: error.message,
        trunkId: trunk.id,
        latency,
      });

      return {
        success: false,
        error: error.message,
        latency,
      };
    }
  }

  private async testSIPConnectivity(trunk: any): Promise<boolean> {
    try {
      // Verificar se podemos resolver o domínio SIP
      const sipDomain = trunk.sipUri.split('@')[1];
      if (!sipDomain) {
        throw new Error('Domínio SIP inválido');
      }

      // TODO: Implementar teste de DNS lookup
      // TODO: Implementar teste de porta SIP (5060)

      return true;
    } catch (error) {
      logger.warn(`❌ Falha no teste de conectividade SIP:`, {
        trunk: trunk.name,
        error: (error as Error).message,
      });
      return false;
    }
  }

  private async testSIPRegistration(trunk: any): Promise<TrunkTestResult> {
    try {
      // Tentar fazer uma chamada de teste para um número de echo
      const testResult = await asteriskService.makeCall(
        trunk.sipUsername,
        'sip:echo@conference.sip2sip.info', // Serviço de echo gratuito
        trunk.name
      );

      if (testResult.success) {
        return {
          success: true,
          response: testResult,
        };
      } else {
        return {
          success: false,
          error: testResult.error || 'Falha na chamada de teste',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async bulkTestTrunks(trunks: any[]): Promise<{ [key: string]: TrunkTestResult }> {
    const results: { [key: string]: TrunkTestResult } = {};

    // Executar testes em paralelo com limite de concorrência
    const concurrencyLimit = 3;
    const chunks = [];

    for (let i = 0; i < trunks.length; i += concurrencyLimit) {
      chunks.push(trunks.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (trunk) => {
          const result = await this.testTrunk(trunk);
          return { trunkId: trunk.id, result };
        })
      );

      chunkResults.forEach(({ trunkId, result }) => {
        results[trunkId] = result;
      });
    }

    return results;
  }
}

export const trunkTestService = new TrunkTestService();
