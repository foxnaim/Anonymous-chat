/**
 * Утилиты для валидации данных
 */

import { z } from 'zod';

/**
 * Валидация email
 */
export const emailSchema = z.string().email('Некорректный email адрес');

/**
 * Валидация пароля компании (точно 10 символов)
 */
export const companyPasswordSchema = z.string().length(10, 'Пароль компании должен содержать ровно 10 символов');

/**
 * Валидация пароля (минимум 8 символов)
 */
export const passwordSchema = z.string().min(8, 'Пароль должен содержать минимум 8 символов');

/**
 * Проверка надежности пароля
 * Требования:
 * - Минимум 8 символов
 * - Хотя бы одна заглавная буква
 * - Хотя бы одна строчная буква
 * - Хотя бы одна цифра
 * - Хотя бы один специальный символ (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export interface PasswordStrength {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const errors: string[] = [];
  
  // Минимум 8 символов
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }
  
  // Заглавные буквы
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву');
  }
  
  // Строчные буквы
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну строчную букву');
  }
  
  // Цифры
  if (!/[0-9]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
  }
  
  // Специальные символы
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы один специальный символ (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }
  
  const isValid = errors.length === 0;
  
  // Определяем силу пароля
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (isValid) {
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }
  
  return { isValid, errors, strength };
};

/**
 * Валидация кода компании (точно 8 символов)
 */
export const companyCodeSchema = z
  .string()
  .length(8, 'Код компании должен содержать ровно 8 символов')
  .regex(/^[A-Z0-9]+$/, 'Код должен содержать только заглавные буквы и цифры');

/**
 * Валидация ID сообщения
 */
export const messageIdSchema = z
  .string()
  .regex(/^FB-\d{4}-[A-Z0-9]+$/, 'Некорректный формат ID сообщения');

/**
 * Проверка валидности email
 */
export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

/**
 * Проверка валидности пароля (базовая проверка длины)
 */
export const isValidPassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

/**
 * Проверка надежности пароля (полная проверка)
 */
export const isStrongPassword = (password: string): boolean => {
  return validatePasswordStrength(password).isValid;
};

/**
 * Проверка валидности пароля компании (точно 10 символов)
 */
export const isValidCompanyPassword = (password: string): boolean => {
  return companyPasswordSchema.safeParse(password).success;
};

/**
 * Проверка валидности кода компании (точно 8 символов)
 */
export const isValidCompanyCode = (code: string): boolean => {
  return companyCodeSchema.safeParse(code).success;
};

/**
 * Проверка валидности ID сообщения
 */
export const isValidMessageId = (id: string): boolean => {
  return messageIdSchema.safeParse(id).success;
};

