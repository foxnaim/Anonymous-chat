/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { formatDate, formatNumber } from '@/lib/utils/format';

describe('Format Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly with default format', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBe('15.01.2024');
    });

    it('formats date with custom format string', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'yyyy-MM-dd');
      expect(formatted).toBe('2024-01-15');
    });

    it('formats date string correctly', () => {
      const dateString = '2024-01-15T00:00:00.000Z';
      const formatted = formatDate(dateString);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('formats date with different locales', () => {
      const date = new Date('2024-01-15');
      const ruFormatted = formatDate(date, 'dd.MM.yyyy', 'ru');
      const enFormatted = formatDate(date, 'MM/dd/yyyy', 'en');
      expect(ruFormatted).toBe('15.01.2024');
      expect(enFormatted).toBe('01/15/2024');
    });

    it('handles invalid dates gracefully', () => {
      const invalid = new Date('invalid');
      // date-fns format может выбросить ошибку для невалидных дат
      expect(() => formatDate(invalid)).toThrow();
    });
  });

  describe('formatNumber', () => {
    it('formats numbers correctly with Russian locale', () => {
      const formatted = formatNumber(1000, 'ru');
      expect(formatted).toBe('1\u00A0000');
      expect(typeof formatted).toBe('string');
    });

    it('formats numbers with English locale', () => {
      const formatted = formatNumber(1000, 'en');
      expect(formatted).toBe('1,000');
    });

    it('formats numbers with Kazakh locale', () => {
      const formatted = formatNumber(1000, 'kk');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(0, 'en')).toBe('0');
    });

    it('handles large numbers', () => {
      const formatted = formatNumber(1234567, 'ru');
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(4);
      expect(formatted).toContain('1');
    });

    it('handles negative numbers', () => {
      const formatted = formatNumber(-1000, 'ru');
      expect(formatted).toContain('-');
    });

    it('handles decimal numbers', () => {
      const formatted = formatNumber(1234.56, 'en');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });
});
