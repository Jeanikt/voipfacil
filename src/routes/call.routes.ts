// src/routes/call.routes.ts
import { Router } from 'express';
import callController from '../controllers/call.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { initiateCallSchema } from '../models/call.model';

const router = Router();

router.use(authenticate);

// Iniciar chamada
router.post('/initiate', validate(initiateCallSchema), callController.initiate);

// Listar chamadas
router.get('/', callController.getAll);

// Estatísticas de chamadas
router.get('/stats', callController.getStats);

// Buscar chamada específica
router.get('/:id', callController.getOne);

// Finalizar chamada
router.post('/:id/hangup', callController.hangup);

export default router;
