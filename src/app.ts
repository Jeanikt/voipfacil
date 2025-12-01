// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import { env } from './config/env';
import redisClient from './config/redis';
import prisma from './config/database';
import asteriskService from './services/asterisk.service';
import logger from './config/logger';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rate-limit.middleware';

// Rotas
import authRoutes from './routes/auth.routes';
import trunkRoutes from './routes/trunk.routes';
import callRoutes from './routes/call.routes';
import providerRoutes from './routes/provider.routes';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? ['https://voipfacil.com.br']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Usar Redis como store de sessão
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    store: new (require('connect-redis')(session))({ client: redisClient.getClient(), prefix: 'session:' }),
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use('/api', apiLimiter);

// Health check completo
app.get('/health', async (_req, res) => {
  try {
    const healthChecks = {
      database: false,
      redis: false,
      asterisk: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    // Verificar database
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = true;
    } catch (error) {
      logger.error('❌ Health check database falhou:', error);
    }

    // Verificar redis
    try {
      await redisClient.exists('health-check');
      healthChecks.redis = true;
    } catch (error) {
      logger.error('❌ Health check redis falhou:', error);
    }

    // Verificar asterisk
    try {
      if (process.env.ASTERISK_ENABLED === 'true') {
        await asteriskService.connect();
        healthChecks.asterisk = asteriskService.isConnected;
      } else {
        healthChecks.asterisk = true; // Mock mode
      }
    } catch (error) {
      logger.error('❌ Health check asterisk falhou:', error);
    }

    const allHealthy = Object.values(healthChecks).every((status) =>
      typeof status === 'boolean' ? status : true
    );

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      ...healthChecks,
      environment: env.NODE_ENV,
    });
  } catch (error) {
    logger.error('❌ Health check completo falhou:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/trunks', trunkRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/providers', providerRoutes);

// Rota raiz com informações da API
app.get('/', (_req, res) => {
  res.json({
    name: 'VoipFácil API',
    version: '1.0.0',
    description: 'Plataforma Open Source para Integrações de VoIP + IA no Brasil',
    documentation: `${env.APP_URL}/docs`,
    health: `${env.APP_URL}/health`,
    endpoints: {
      auth: `${env.APP_URL}/api/auth`,
      trunks: `${env.APP_URL}/api/trunks`,
      calls: `${env.APP_URL}/api/calls`,
      providers: `${env.APP_URL}/api/providers`,
    },
  });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
  });
});

// Inicialização otimizada
const startServer = async () => {
  try {
    logger.info('🚀 Iniciando VoipFácil...', {
      environment: env.NODE_ENV,
      port: env.PORT,
      nodeVersion: process.version,
    });

    // Conectar serviços
    await redisClient.connect();

    if (process.env.ASTERISK_ENABLED === 'true') {
      await asteriskService.connect();
    }

    // Verificar conexão com database
    await prisma.$connect();
    logger.info('✅ Conectado ao PostgreSQL');

    app.listen(env.PORT, () => {
      logger.info(`✅ Servidor rodando em ${env.APP_URL}`);
      logger.info(`📝 Ambiente: ${env.NODE_ENV}`);
      logger.info(`🛡️  Modo seguro: ${env.NODE_ENV === 'production'}`);
      logger.info(`📊 Health check: ${env.APP_URL}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('🛑 Recebido SIGTERM, encerrando graciosamente...');
      await prisma.$disconnect();
      await redisClient.disconnect();
      asteriskService.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('🛑 Recebido SIGINT, encerrando graciosamente...');
      await prisma.$disconnect();
      await redisClient.disconnect();
      asteriskService.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('❌ Erro crítico ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
