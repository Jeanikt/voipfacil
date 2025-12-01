// tests/unit/fallback.service.test.ts
import { fallbackService } from '../../src/services/fallback.service';

describe('FallbackService', () => {
  const mockTrunks = [
    {
      id: '1',
      name: 'Tronco A',
      sipUsername: 'userA',
      currentCalls: 0,
      maxChannels: 5,
      provider: 'Directcall',
    },
    {
      id: '2',
      name: 'Tronco B',
      sipUsername: 'userB',
      currentCalls: 0,
      maxChannels: 3,
      provider: 'VoipMundo',
    },
  ];

  it('deve tentar troncos em ordem de prioridade', async () => {
    const result = await fallbackService.makeCallWithFallback({
      to: '5511999999999',
      from: '5511888888888',
      trunks: mockTrunks,
      options: {
        recordCall: true,
        enableTranscription: false,
        enableSentimentAnalysis: false,
      },
    });

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('trunkId');
  });

  it('deve falhar quando todos os troncos estiverem inativos', async () => {
    const inactiveTrunks = mockTrunks.map((trunk) => ({
      ...trunk,
      currentCalls: trunk.maxChannels + 1, // Excede limite
    }));

    const result = await fallbackService.makeCallWithFallback({
      to: '5511999999999',
      from: '5511888888888',
      trunks: inactiveTrunks,
      options: {
        recordCall: true,
        enableTranscription: false,
        enableSentimentAnalysis: false,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Falha em');
  });
});
