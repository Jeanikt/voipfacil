import { createClient, RedisClientType } from 'redis';
import { env } from './env';
import logger from './logger';

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: env.REDIS_URL,
      password: env.REDIS_PASSWORD,
    }) as RedisClientType;

    this.client.on('error', (err) => {
      logger.error('❌ Redis Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('✅ Conectado ao Redis');
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}

const redisClient = new RedisClient();

export default redisClient;
