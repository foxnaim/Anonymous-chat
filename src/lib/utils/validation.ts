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
 * Валидация пароля (минимум 6 символов)
 */
export const passwordSchema = z.string().min(6, 'Пароль должен содержать минимум 6 символов');

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
 * Проверка валидности пароля
 */
export const isValidPassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
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

