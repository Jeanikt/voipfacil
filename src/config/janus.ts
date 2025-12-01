// src/config/janus.ts
export const janusConfig = {
  httpUrl: process.env.JANUS_HTTP_URL || 'http://localhost:8088/janus',
  wsUrl: process.env.JANUS_WS_URL || 'ws://localhost:8188',
  adminSecret: process.env.JANUS_ADMIN_SECRET || '',
  adminKey: process.env.JANUS_ADMIN_KEY || '',

  // Timeouts
  requestTimeout: 15000,
  sessionTimeout: 30000,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // WebRTC config
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],

  // SIP config
  sip: {
    registerTimeout: 10000,
    callTimeout: 30000,
    maxConnections: 10,
  },
};

export type JanusConfig = typeof janusConfig;
