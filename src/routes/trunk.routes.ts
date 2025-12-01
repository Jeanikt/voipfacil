// src/routes/trunk.routes.ts
import { Router } from 'express';
import trunkController from '../controllers/trunk.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createTrunkSchema, updateTrunkSchema } from '../models/trunk.model';

const router = Router();

router.use(authenticate);

// CRUD de troncos
router.post('/', validate(createTrunkSchema), trunkController.create);

router.get('/', trunkController.getAll);
router.get('/:id', trunkController.getOne);
router.put('/:id', validate(updateTrunkSchema), trunkController.update);
router.delete('/:id', trunkController.delete);

// Testar tronco
router.post('/:id/test', trunkController.test);

// Estatísticas do tronco
router.get('/:id/stats', trunkController.getStats);

export default router;
