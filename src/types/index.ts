import { User as PrismaUser } from '@prisma/client';

export interface AuthenticatedUser extends PrismaUser {
  id: string;
  email: string;
  name: string | null;
  apiKey: string;
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: { value: string; verified: boolean }[];
  photos: { value: string }[];
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
