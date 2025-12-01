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

// Extensão do namespace Express para incluir nosso tipo de usuário
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

// Isso força o TypeScript a tratar este arquivo como um módulo
export {};
