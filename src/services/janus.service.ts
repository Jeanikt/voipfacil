import axios, { AxiosInstance } from "axios";
import WebSocket from "ws";
import { env } from "@/config/env";
import logger from "@/config/logger";
import { EventEmitter } from "events";

class JanusService extends EventEmitter {
  private httpClient: AxiosInstance;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private useMock: boolean =
    env.USE_MOCKS === "true" || env.JANUS_ENABLED === "false";

  constructor() {
    super();
    this.httpClient = axios.create({
      baseURL: env.JANUS_HTTP_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createSession(): Promise<string> {
    if (this.useMock) {
      this.sessionId = `mock_session_${Date.now()}`;
      logger.warn("⚠️ MODO MOCK: Sessão Janus simulada");
      return this.sessionId;
    }

    // Código real
    try {
      const response = await this.httpClient.post("", {
        janus: "create",
        transaction: this.generateTransactionId(),
      });

      if (response.data.janus === "success") {
        this.sessionId = response.data.data.id.toString();
        logger.info(`✅ Sessão Janus criada: ${this.sessionId}`);
        return this.sessionId;
      }

      throw new Error("Falha ao criar sessão Janus");
    } catch (error) {
      logger.error("❌ Erro ao criar sessão Janus:", error);
      throw error;
    }
  }

  async attachPlugin(pluginName: string = "janus.plugin.sip"): Promise<string> {
    if (this.useMock) {
      const handleId = `mock_handle_${Date.now()}`;
      logger.warn("⚠️ MODO MOCK: Plugin Janus simulado");
      return handleId;
    }

    // Código real...
    return "";
  }

  async registerSIP(
    handleId: string,
    sipConfig: {
      username: string;
      secret: string;
      proxy: string;
    }
  ): Promise<boolean> {
    if (this.useMock) {
      logger.warn("⚠️ MODO MOCK: SIP registrado (simulado)");
      return true;
    }

    // Código real...
    return false;
  }

  connectWebSocket(): void {
    if (this.useMock) {
      logger.warn("⚠️ MODO MOCK: WebSocket Janus simulado");
      this.emit("ws:connected");
      return;
    }

    // Código real...
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async destroySession(): Promise<void> {
    if (this.useMock) {
      this.sessionId = null;
      logger.info("✅ MOCK: Sessão Janus destruída");
      return;
    }

    // Código real...
  }
}

export default new JanusService();
