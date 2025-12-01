// src/utils/validation.ts
import { ZodError } from 'zod';

export const formatZodError = (error: ZodError): Record<string, string[]> => {
  const formattedErrors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });

  return formattedErrors;
};

export const isBrazilianPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return /^(55)?\d{2}9?\d{8}$/.test(cleanPhone);
};

export const formatBrazilianPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');

  if (clean.length === 11) {
    return `+55${clean}`;
  }
  if (clean.length === 13 && clean.startsWith('55')) {
    return `+${clean}`;
  }

  return phone;
};

export const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/\D/g, '');

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Algoritmo de validação de CNPJ
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};
