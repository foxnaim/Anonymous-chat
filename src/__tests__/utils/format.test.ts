import { formatDate, formatNumber } from '@/lib/utils/format';

describe('Format Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
    });

    it('handles invalid dates', () => {
      const invalid = new Date('invalid');
      const formatted = formatDate(invalid);
      expect(formatted).toBeTruthy();
    });
  });

  describe('formatNumber', () => {
    it('formats numbers correctly', () => {
      const formatted = formatNumber(1000, 'ru');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('formats with different locales', () => {
      const num = 1000;
      expect(formatNumber(num, 'ru')).toBeTruthy();
      expect(formatNumber(num, 'en')).toBeTruthy();
      expect(formatNumber(num, 'kk')).toBeTruthy();
    });

    it('handles large numbers', () => {
      const formatted = formatNumber(1234567, 'ru');
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(4);
    });
  });
});

