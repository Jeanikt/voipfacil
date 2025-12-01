import crypto from 'crypto';
import { env } from '@/config/env';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const key = crypto.scryptSync(env.JWT_SECRET, 'voipfacil-salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const ivHex = parts[0];
  const authTagHex = parts[1];
  const encrypted = parts[2];

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data');
  }

  const key = crypto.scryptSync(env.JWT_SECRET, 'voipfacil-salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function generateApiKey(): string {
  return `vf_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt + env.JWT_SECRET, 10000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto
    .pbkdf2Sync(password, salt + env.JWT_SECRET, 10000, 64, 'sha512')
    .toString('hex');
  return hash === originalHash;
}
