import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import prisma from './database';
import logger from './logger';
import { randomBytes } from 'crypto';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('Email não fornecido pelo Google'));
        }

        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (!user) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId, avatar, name },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email,
                googleId,
                name,
                avatar,
                apiKey: `vf_${randomBytes(32).toString('hex')}`,
                lgpdConsent: true,
                lgpdConsentDate: new Date(),
              },
            });

            logger.info(`✅ Novo usuário via Google OAuth: ${email}`);
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return done(null, user);
      } catch (error) {
        logger.error('❌ Erro no Google OAuth:', error);
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
