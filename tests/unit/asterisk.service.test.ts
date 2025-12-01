// tests/unit/asterisk.service.test.ts
import AsteriskService from '../../src/services/asterisk.service';
import { env } from '../../src/config/env';

describe('AsteriskService', () => {
  beforeEach(() => {
    // Reset do singleton para testes
    (AsteriskService as any).ami = null;
    AsteriskService.isConnected = false;
  });

  describe('Modo Mock', () => {
    beforeEach(() => {
      process.env.USE_MOCKS = 'true';
    });

    it('deve conectar em modo mock', async () => {
      await AsteriskService.connect();
      expect(AsteriskService.isConnected).toBe(true);
    });

    it('deve fazer chamada em modo mock', async () => {
      const result = await AsteriskService.makeCall('5511999999999', '5511888888888');
      expect(result.success).toBe(true);
      expect(result.uniqueid).toContain('mock_');
    });

    it('deve criar channel SIP corretamente', () => {
      const channel = AsteriskService.createSIPChannel('5511999999999');
      expect(channel).toBe('SIP/5511999999999');

      const channelComTrunk = AsteriskService.createSIPChannel('5511999999999', 'directcall');
      expect(channelComTrunk).toBe('SIP/directcall/5511999999999');
    });
  });

  describe('Status do Serviço', () => {
    it('deve retornar status correto', async () => {
      const status = await AsteriskService.getStatus();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('reconnectAttempts');
      expect(status).toHaveProperty('channelsCount');
    });
  });
});
