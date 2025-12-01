import axios, { AxiosInstance, AxiosResponse } from 'axios';
import WebSocket from 'ws';
import { env } from '../config/env';
import logger from '../config/logger';
import { EventEmitter } from 'events';

// Interfaces para tipagem forte
interface JanusResponse {
  janus: string;
  transaction: string;
  session_id?: number;
  data?: {
    id: number;
  };
  plugindata?: {
    data?: any;
  };
}

interface JanusSession {
  id: number;
  createdAt: Date;
  lastActivity: Date;
}

class JanusService extends EventEmitter {
  private httpClient: AxiosInstance;
  private ws: WebSocket | null = null;
  private sessionId: number | null = null;
  private useMock: boolean;
  private sessions: Map<number, JanusSession> = new Map();
  private isConnected: boolean = false;

  constructor() {
    super();
    this.useMock = env.USE_MOCKS || !env.JANUS_ENABLED;

    this.httpClient = axios.create({
      baseURL: env.JANUS_HTTP_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        logger.error('❌ Erro na requisição Janus:', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async createSession(): Promise<number> {
    if (this.useMock) {
      const mockSessionId = Math.floor(Math.random() * 1000000);
      this.sessionId = mockSessionId;
      this.sessions.set(mockSessionId, {
        id: mockSessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
      });

      logger.warn('⚠️ MODO MOCK: Sessão Janus simulada', { sessionId: mockSessionId });
      return mockSessionId;
    }

    try {
      const transaction = this.generateTransactionId();

      const response: AxiosResponse<JanusResponse> = await this.httpClient.post('', {
        janus: 'create',
        transaction: transaction,
      });

      if (response.data.janus === 'success' && response.data.session_id) {
        this.sessionId = response.data.session_id;

        this.sessions.set(this.sessionId, {
          id: this.sessionId,
          createdAt: new Date(),
          lastActivity: new Date(),
        });

        logger.info('✅ Sessão Janus criada com sucesso', {
          sessionId: this.sessionId,
          transaction: transaction,
        });

        this.isConnected = true;
        return this.sessionId;
      }

      throw new Error(`Resposta inválida do Janus: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      logger.error('❌ Erro ao criar sessão Janus:', {
        error: error.message,
        stack: error.stack,
        url: env.JANUS_HTTP_URL,
      });

      this.isConnected = false;
      throw new Error(`Falha ao criar sessão Janus: ${error.message}`);
    }
  }

  async attachPlugin(plugin: string = 'janus.plugin.sip'): Promise<number> {
    if (!this.sessionId) {
      throw new Error('Sessão Janus não criada. Chame createSession() primeiro.');
    }

    if (this.useMock) {
      const handleId = Math.floor(Math.random() * 10000);
      logger.warn('⚠️ MODO MOCK: Plugin anexado simuladamente', {
        sessionId: this.sessionId,
        plugin,
        handleId,
      });
      return handleId;
    }

    try {
      const transaction = this.generateTransactionId();

      const response: AxiosResponse<JanusResponse> = await this.httpClient.post(
        `/${this.sessionId}`,
        {
          janus: 'attach',
          plugin: plugin,
          transaction: transaction,
        }
      );

      if (response.data.janus === 'success' && response.data.data?.id) {
        const handleId = response.data.data.id;

        logger.info('✅ Plugin anexado com sucesso', {
          sessionId: this.sessionId,
          plugin,
          handleId,
          transaction,
        });

        return handleId;
      }

      throw new Error('Falha ao anexar plugin ao Janus');
    } catch (error: any) {
      logger.error('❌ Erro ao anexar plugin Janus:', {
        sessionId: this.sessionId,
        plugin,
        error: error.message,
      });
      throw error;
    }
  }

  async sendMessage(handleId: number, message: any, jsep?: any): Promise<any> {
    if (!this.sessionId) {
      throw new Error('Sessão Janus não criada');
    }

    if (this.useMock) {
      logger.warn('⚠️ MODO MOCK: Mensagem enviada simuladamente', {
        sessionId: this.sessionId,
        handleId,
        message,
      });
      return { janus: 'ack', transaction: this.generateTransactionId() };
    }

    try {
      const transaction = this.generateTransactionId();
      const payload: any = {
        janus: 'message',
        body: message,
        transaction: transaction,
      };

      if (jsep) {
        payload.jsep = jsep;
      }

      const response: AxiosResponse<JanusResponse> = await this.httpClient.post(
        `/${this.sessionId}/${handleId}`,
        payload
      );

      // Atualiza última atividade
      const session = this.sessions.get(this.sessionId);
      if (session) {
        session.lastActivity = new Date();
      }

      return response.data;
    } catch (error: any) {
      logger.error('❌ Erro ao enviar mensagem Janus:', {
        sessionId: this.sessionId,
        handleId,
        error: error.message,
      });
      throw error;
    }
  }

  async createOffer(handleId: number, options: any = {}): Promise<any> {
    if (this.useMock) {
      const mockJsep = {
        type: 'offer',
        sdp: 'v=0\r\no=mock...',
      };
      logger.warn('⚠️ MODO MOCK: Offer criada simuladamente', { handleId });
      return mockJsep;
    }

    // Implementação simplificada
    const message = {
      request: 'create',
      ...options,
    };

    return this.sendMessage(handleId, message);
  }

  async registerSip(
    handleId: number,
    username: string,
    secret: string,
    domain: string
  ): Promise<void> {
    const registerMessage = {
      request: 'register',
      username: `sip:${username}@${domain}`,
      secret: secret,
    };

    try {
      const response = await this.sendMessage(handleId, registerMessage);

      if (response.janus === 'ack') {
        logger.info('✅ Comando de registro SIP enviado', { username, domain });
      } else {
        logger.warn('⚠️ Resposta inesperada do registro SIP', { response });
      }
    } catch (error: any) {
      logger.error('❌ Erro no registro SIP:', {
        username,
        domain,
        error: error.message,
      });
      throw error;
    }
  }

  async makeCall(handleId: number, number: string, domain: string): Promise<any> {
    const sipUri = `sip:${number}@${domain}`;

    try {
      // Primeiro cria a offer
      const offer = await this.createOffer(handleId, {
        tracks: [{ type: 'audio', capture: true, recv: true }],
      });

      // Envia a chamada
      const callMessage = {
        request: 'call',
        uri: sipUri,
      };

      const response = await this.sendMessage(handleId, callMessage, offer);
      return response;
    } catch (error: any) {
      logger.error('❌ Erro ao realizar chamada:', {
        number,
        domain,
        error: error.message,
      });
      throw error;
    }
  }

  async destroySession(): Promise<void> {
    if (this.sessionId && !this.useMock) {
      try {
        await this.httpClient.post(`/${this.sessionId}`, {
          janus: 'destroy',
          transaction: this.generateTransactionId(),
        });
      } catch (error: any) {
        logger.warn('⚠️ Erro ao destruir sessão Janus (pode ser normal):', {
          sessionId: this.sessionId,
          error: error.message,
        });
      }
    }

    this.sessions.delete(this.sessionId!);
    this.sessionId = null;
    this.isConnected = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    logger.info('✅ Sessão Janus destruída', { sessionId: this.sessionId });
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus(): { isConnected: boolean; sessionId: number | null; activeSessions: number } {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      activeSessions: this.sessions.size,
    };
  }

  async healthCheck(): Promise<boolean> {
    if (this.useMock) return true;

    if (!this.sessionId) return false;

    try {
      const response = await this.httpClient.get(`/${this.sessionId}`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  cleanupOldSessions(maxAgeMinutes: number = 60): void {
    const now = new Date();
    let cleanedCount = 0;

    this.sessions.forEach((session, sessionId) => {
      const ageMinutes = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60);

      if (ageMinutes > maxAgeMinutes) {
        this.sessions.delete(sessionId);
        cleanedCount++;

        logger.info('🧹 Sessão Janus antiga removida', {
          sessionId,
          ageMinutes: Math.round(ageMinutes),
        });
      }
    });

    if (cleanedCount > 0) {
      logger.info('✅ Cleanup de sessões completado', { cleanedCount });
    }
  }
}

export default new JanusService();
