// src/services/asterisk.service.ts
import { env } from '../config/env';
import logger from '../config/logger';
import { EventEmitter } from 'events';

interface AsteriskOriginateParams {
  channel: string;
  context: string;
  exten: string;
  priority: number;
  callerid?: string;
  timeout?: number;
  variables?: Record<string, string>;
}

interface OriginateResult {
  success: boolean;
  uniqueid?: string;
  error?: string;
  response?: any;
}

class AsteriskService extends EventEmitter {
  public isConnected: boolean = false;
  private useMock: boolean = process.env.USE_MOCKS === 'true' || process.env.ASTERISK_ENABLED === 'false';
  private ami: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000;

  constructor() {
    super();
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (this.useMock) {
      logger.warn('⚠️ MODO MOCK: Asterisk simulado para desenvolvimento');
      this.isConnected = true;
      this.emit('connected');
      return;
    }

    try {
      const asteriskManager = await import('asterisk-manager');
      const createManager = asteriskManager.default || asteriskManager;

      this.ami = createManager(
        env.ASTERISK_PORT,
        env.ASTERISK_HOST,
        env.ASTERISK_USERNAME,
        env.ASTERISK_PASSWORD,
        true
      );

      this.setupEventHandlers();

      // Aguardar conexão
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao conectar no Asterisk'));
        }, 10000);

        this.ami.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.ami.once('error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      logger.info('✅ Conectado ao Asterisk AMI', {
        host: env.ASTERISK_HOST,
        port: env.ASTERISK_PORT,
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    } catch (error: any) {
      logger.error('❌ Falha ao conectar no Asterisk:', {
        error: error.message,
        host: env.ASTERISK_HOST,
        port: env.ASTERISK_PORT,
      });

      this.handleConnectionError(error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.ami) return;

    this.ami.on('connect', () => {
      logger.info('🔌 Conexão AMI estabelecida');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.ami.on('close', () => {
      logger.warn('🔌 Conexão AMI fechada');
      this.isConnected = false;
      this.emit('disconnected');
      this.attemptReconnect();
    });

    this.ami.on('error', (error: Error) => {
      logger.error('❌ Erro na conexão AMI:', error);
      this.emit('error', error);
    });

    // Eventos de monitoramento de chamadas
    this.ami.on('hangup', (event: any) => {
      logger.info('📴 Chamada finalizada', {
        channel: event.channel,
        uniqueid: event.uniqueid,
        cause: event.cause,
      });
      this.emit('call:hangup', event);
    });

    this.ami.on('newstate', (event: any) => {
      if (event.channelstate === '5') {
        // Ringing
        logger.info('🔔 Chamada tocando', {
          channel: event.channel,
          uniqueid: event.uniqueid,
        });
        this.emit('call:ringing', event);
      } else if (event.channelstate === '6') {
        // Up
        logger.info('✅ Chamada atendida', {
          channel: event.channel,
          uniqueid: event.uniqueid,
        });
        this.emit('call:answered', event);
      }
    });

    this.ami.on('originateResponse', (event: any) => {
      logger.info('📞 Resposta de originate', {
        response: event.response,
        uniqueid: event.uniqueid,
      });
      this.emit('call:originate', event);
    });
  }

  private handleConnectionError(error: any): void {
    this.isConnected = false;
    this.emit('error', error);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      logger.error('❌ Máximo de tentativas de reconexão atingido');
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;

    logger.warn(
      `🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`
    );

    setTimeout(() => {
      this.connect().catch(() => {
        // Erro já é tratado no connect()
      });
    }, delay);
  }

  async originate(params: AsteriskOriginateParams): Promise<OriginateResult> {
    if (this.useMock) {
      return this.mockOriginate(params);
    }

    if (!this.isConnected || !this.ami) {
      throw new Error('Asterisk AMI não está conectado');
    }

    return new Promise<OriginateResult>((resolve) => {
      const originateParams = {
        channel: params.channel,
        context: params.context,
        exten: params.exten,
        priority: params.priority,
        callerid: params.callerid,
        timeout: params.timeout || 30000,
        variables: this.stringifyVariables(params.variables || {}),
      };

      this.ami.originate(originateParams, (error: any, response: any) => {
        if (error) {
          logger.error('❌ Erro ao originar chamada:', {
            params: originateParams,
            error: error.message,
          });
          resolve({ success: false, error: error.message });
        } else {
          logger.info('📞 Chamada originada com sucesso', {
            params: originateParams,
            response: response,
          });
          resolve({
            success: true,
            uniqueid: response.uniqueid,
            response: response,
          });
        }
      });
    });
  }

  private stringifyVariables(variables: Record<string, string>): string {
    return Object.entries(variables)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }

  private async mockOriginate(params: AsteriskOriginateParams): Promise<OriginateResult> {
    const mockUniqueId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('📞 MOCK: Chamada simulada iniciada', {
      channel: params.channel,
      exten: params.exten,
      uniqueid: mockUniqueId,
    });

    // Simular eventos de chamada em tempo real
    setTimeout(() => {
      this.emit('call:ringing', {
        uniqueid: mockUniqueId,
        channel: params.channel,
      });
    }, 1000);

    setTimeout(() => {
      this.emit('call:answered', {
        uniqueid: mockUniqueId,
        channel: params.channel,
      });
    }, 3000);

    setTimeout(() => {
      this.emit('call:hangup', {
        uniqueid: mockUniqueId,
        channel: params.channel,
        cause: '16',
      });
    }, 15000);

    return {
      success: true,
      uniqueid: mockUniqueId,
    };
  }

  async hangup(channel: string): Promise<boolean> {
    if (this.useMock) {
      logger.info('📴 MOCK: Chamada desligada', { channel });
      this.emit('call:hangup', {
        channel,
        cause: '16',
      });
      return true;
    }

    if (!this.isConnected || !this.ami) {
      throw new Error('Asterisk AMI não está conectado');
    }

    return new Promise<boolean>((resolve) => {
      this.ami.hangup(channel, (error: any, _response: any) => {
        if (error) {
          logger.error('❌ Erro ao desligar chamada:', {
            channel,
            error: error.message,
          });
          resolve(false);
        } else {
          logger.info('📴 Chamada desligada com sucesso', { channel });
          resolve(true);
        }
      });
    });
  }

  async getChannels(): Promise<any[]> {
    if (this.useMock) {
      return [
        {
          channel: 'MockChannel/1',
          state: 'Up',
          uniqueid: 'mock_1',
        },
      ];
    }

    if (!this.isConnected || !this.ami) {
      throw new Error('Asterisk AMI não está conectado');
    }

    return new Promise<any[]>((resolve) => {
      this.ami.action({ action: 'CoreShowChannels' }, (error: any, response: any) => {
        if (error) {
          logger.error('❌ Erro ao obter canais:', error);
          resolve([]);
        } else {
          resolve(response.channels || []);
        }
      });
    });
  }

  async getStatus(): Promise<{
    isConnected: boolean;
    reconnectAttempts: number;
    channelsCount: number;
  }> {
    const channels = await this.getChannels();

    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      channelsCount: channels.length,
    };
  }

  disconnect(): void {
    this.isConnected = false;
    this.reconnectAttempts = 0;

    if (this.ami) {
      this.ami.removeAllListeners();
      this.ami = null;
    }

    logger.info('✅ Asterisk desconectado');
  }

  createSIPChannel(number: string, trunk?: string): string {
    if (trunk) {
      return `SIP/${trunk}/${number}`;
    }
    return `SIP/${number}`;
  }

  async makeCall(from: string, to: string, trunk?: string): Promise<OriginateResult> {
    const channel = this.createSIPChannel(to, trunk);

    return this.originate({
      channel: channel,
      context: env.ASTERISK_CONTEXT || 'from-voipfacil',
      exten: 's',
      priority: 1,
      callerid: from,
      timeout: 30000,
      variables: {
        FROM_DID: from,
        'CALLERID(num)': from,
        voipfacil_call: 'true',
      },
    });
  }
}

export default new AsteriskService();
