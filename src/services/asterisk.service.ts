import { env } from "@/config/env";
import logger from "@/config/logger";
import { EventEmitter } from "events";

class AsteriskService extends EventEmitter {
  private isConnected: boolean = false;
  private useMock: boolean =
    env.USE_MOCKS === "true" || env.ASTERISK_ENABLED === "false";

  constructor() {
    super();
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (this.useMock) {
      logger.warn("⚠️ MODO MOCK: Asterisk simulado (desenvolvimento local)");
      this.isConnected = true;
      this.emit("connected");
      return;
    }

    // Código real do Asterisk (para produção)
    try {
      const { Manager } = await import("asterisk-manager");

      const ami = new Manager(
        env.ASTERISK_PORT,
        env.ASTERISK_HOST,
        env.ASTERISK_USERNAME,
        env.ASTERISK_PASSWORD,
        true
      );

      ami.keepConnected();

      ami.on("connect", () => {
        logger.info("✅ Conectado ao Asterisk AMI");
        this.isConnected = true;
        this.emit("connected");
      });

      ami.on("close", () => {
        logger.warn("⚠️ Desconectado do Asterisk AMI");
        this.isConnected = false;
        this.emit("disconnected");
      });

      ami.on("error", (error: Error) => {
        logger.error("❌ Erro no Asterisk AMI:", error);
        this.emit("error", error);
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout ao conectar no Asterisk"));
        }, 10000);

        ami.once("connect", () => {
          clearTimeout(timeout);
          resolve();
        });

        ami.once("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch (error) {
      logger.error("❌ Falha ao conectar no Asterisk:", error);
      throw error;
    }
  }

  async originate(params: {
    channel: string;
    context: string;
    exten: string;
    priority: number;
    callerid?: string;
    timeout?: number;
    variables?: Record<string, string>;
  }): Promise<{ success: boolean; uniqueid?: string; error?: string }> {
    if (this.useMock) {
      // MOCK: Simula chamada bem-sucedida
      const mockUniqueId = `mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      logger.info(`📞 MOCK: Chamada simulada iniciada para ${params.channel}`);

      // Simula eventos após 2 segundos
      setTimeout(() => {
        this.emit("call:ringing", {
          uniqueid: mockUniqueId,
          channel: params.channel,
        });
      }, 2000);

      setTimeout(() => {
        this.emit("call:answered", {
          uniqueid: mockUniqueId,
          channel: params.channel,
        });
      }, 5000);

      return { success: true, uniqueid: mockUniqueId };
    }

    // Código real (produção)
    if (!this.isConnected) {
      throw new Error("Asterisk AMI não está conectado");
    }

    // Implementação real aqui...
    return { success: true };
  }

  async hangup(channel: string): Promise<boolean> {
    if (this.useMock) {
      logger.info(`📴 MOCK: Chamada desligada ${channel}`);
      return true;
    }

    // Código real
    return false;
  }

  async getChannels(): Promise<any[]> {
    if (this.useMock) {
      return [];
    }

    // Código real
    return [];
  }

  disconnect(): void {
    this.isConnected = false;
    logger.info("✅ Asterisk desconectado");
  }
}

export default new AsteriskService();
