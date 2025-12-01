import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

class ProviderController {
  async getRecommendations(_req: Request, res: Response): Promise<void> {
    try {
      const providers = await prisma.provider.findMany({
        where: { isActive: true },
        orderBy: { precoMensal: 'asc' },
      });

      res.json({
        success: true,
        data: providers,
        total: providers.length,
      });
    } catch (error) {
      logger.error('❌ Erro ao buscar providers:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar recomendações',
      });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const provider = await prisma.provider.findUnique({
        where: { id },
      });

      if (!provider) {
        res.status(404).json({ success: false, error: 'Provedor não encontrado' });
        return;
      }

      res.json({ success: true, data: provider });
    } catch (error) {
      logger.error('❌ Erro ao buscar provider:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar provedor' });
    }
  }

  async compare(req: Request, res: Response): Promise<void> {
    try {
      // Aceita query param `ids` como 'id1,id2,id3' ou múltiplos ?ids=id1&ids=id2
      const idsParam = req.query.ids;
      let ids: string[] = [];

      if (!idsParam) {
        res.status(400).json({ success: false, error: 'Parâmetro `ids` é requerido (ex: ?ids=id1,id2)' });
        return;
      }

      if (Array.isArray(idsParam)) {
        ids = idsParam.flatMap((v) => String(v).split(',').map((s) => s.trim()));
      } else {
        ids = String(idsParam).split(',').map((s) => s.trim());
      }

      ids = ids.filter(Boolean);

      if (ids.length < 2) {
        res.status(400).json({ success: false, error: 'Forneça ao menos 2 ids para comparação' });
        return;
      }

      const providers = await prisma.provider.findMany({
        where: { id: { in: ids } },
      });

      // Montar um resumo comparativo simples
      const comparison = providers.map((p) => ({
        id: p.id,
        name: p.name,
        precoMensal: p.precoMensal,
        tarifaFixo: p.tarifaFixo,
        tarifaMovel: p.tarifaMovel,
        canais: p.canais,
        features: p.features,
        isActive: p.isActive,
      }));

      res.json({ success: true, data: comparison });
    } catch (error) {
      logger.error('❌ Erro ao comparar providers:', error);
      res.status(500).json({ success: false, error: 'Erro ao comparar provedores' });
    }
  }
}

export default new ProviderController();
