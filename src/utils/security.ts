import crypto from 'crypto';
import { env } from '@/config/env';

export const generateApiKey = (): string => {
  return `vf_${crypto.randomBytes(32).toString('hex')}`;
};

export const hashPassword = (password: string): string => {
  return crypto
    .createHash('sha256')
    .update(password + env.JWT_SECRET)
    .digest('hex');
};

export const generateRandomString = (length: number = 16): string => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '');
};

export const validatePhoneNumber = (phone: string): boolean => {
  const regex = /^(\+55|55)?\s?(\d{2})\s?(\d{4,5})-?(\d{4})$/;
  return regex.test(phone);
};

export const encrypt = (text: string): string => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(env.JWT_SECRET, 'voipfacil-salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  const ivHex = parts[0];
  const authTagHex = parts[1];
  const encrypted = parts[2];

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data');
  }

  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(env.JWT_SECRET, 'voipfacil-salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
