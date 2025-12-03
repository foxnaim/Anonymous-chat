/**
 * Утилиты для форматирования данных
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';

const locales = { ru, en: enUS, kk };

/**
 * Форматирует дату в зависимости от языка
 */
export const formatDate = (
  date: string | Date,
  formatStr: string = 'dd.MM.yyyy',
  locale: 'ru' | 'en' | 'kk' = 'ru'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: locales[locale] });
};

/**
 * Форматирует дату как "X времени назад"
 */
export const formatRelativeTime = (
  date: string | Date,
  locale: 'ru' | 'en' | 'kk' = 'ru'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: locales[locale],
  });
};

/**
 * Форматирует число с разделителями тысяч
 */
export const formatNumber = (num: number, locale: 'ru' | 'en' | 'kk' = 'ru'): string => {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'kk-KZ').format(num);
};

/**
 * Форматирует размер файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Форматирует процент
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Обрезает текст до указанной длины
 */
export const truncate = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

