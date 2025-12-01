// src/config/asterisk.ts
export const asteriskConfig = {
  host: process.env.ASTERISK_HOST || 'localhost',
  port: parseInt(process.env.ASTERISK_PORT || '5038'),
  username: process.env.ASTERISK_USERNAME || 'admin',
  password: process.env.ASTERISK_PASSWORD || 'admin',

  // Configurações de reconexão
  reconnect: {
    maxAttempts: 5,
    interval: 5000,
    backoff: true,
  },

  // Timeouts
  originateTimeout: 30000,
  actionTimeout: 10000,

  // Contextos e extensões padrão
  contexts: {
    incoming: 'from-voipfacil',
    outgoing: 'to-voipfacil',
    dialplan: 'voipfacil-dialplan',
  },
};

export type AsteriskConfig = typeof asteriskConfig;
