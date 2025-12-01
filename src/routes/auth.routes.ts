// src/routes/auth.routes.ts
import { Router } from 'express';
import passport from 'passport';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Login Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent',
  })
);

// Callback Google
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.APP_URL}/login?error=auth_failed`,
  }),
  authController.googleCallback
);

// Dados do usuário atual
router.get('/me', authenticate, authController.me);

// Atualizar perfil
router.put('/profile', authenticate, authController.updateProfile);

// Logout
router.post('/logout', authenticate, authController.logout);

// Regenerar API Key
router.post('/regenerate-api-key', authenticate, authController.regenerateApiKey);

export default router;
