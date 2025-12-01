// src/routes/provider.routes.ts
import { Router } from 'express';
import providerController from '../controllers/provider.controller';
import { validate } from '../middlewares/validation.middleware';
import { providerRecommendationSchema } from '../models/provider.model';

const router = Router();

// Recomendações de provedores
router.get(
  '/recommendations',
  validate(providerRecommendationSchema, 'query'),
  providerController.getRecommendations
);

// Buscar provedor específico
// Comparar provedores (colocar antes de /:id para não ser interpretado como id)
router.get('/compare', providerController.compare);

// Buscar provedor específico
router.get('/:id', providerController.getOne);

export default router;
