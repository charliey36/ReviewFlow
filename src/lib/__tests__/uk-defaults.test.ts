import { describe, expect, it } from '@jest/globals';
import {
  formatUKCurrency,
  formatUKDate,
  formatUKDateTime,
  getUKTimezone,
  UK_CURRENCY,
  UK_TIMEZONE,
} from '../uk-defaults';

describe('uk-defaults', () => {
  describe('formatUKDate', () => {
    it('renders DD/MM/YYYY', () => {
      // 9 January 2026 — distinguishes DD/MM from MM/DD.
      expect(formatUKDate(new Date('2026-01-09T12:00:00Z'))).toBe('09/01/2026');
    });

    it('zero-pads single-digit days and months', () => {
      expect(formatUKDate(new Date('2026-03-05T12:00:00Z'))).toBe('05/03/2026');
    });
  });

  describe('formatUKDateTime', () => {
    it('renders DD/MM/YYYY with 24h time in Europe/London', () => {
      // 14:30 UTC in January (GMT) == 14:30 London.
      expect(formatUKDateTime(new Date('2026-01-09T14:30:00Z'))).toBe('09/01/2026, 14:30');
    });

    it('applies BST offset in summer', () => {
      // 14:30 UTC in July (BST, +1) == 15:30 London.
      expect(formatUKDateTime(new Date('2026-07-09T14:30:00Z'))).toBe('09/07/2026, 15:30');
    });
  });

  describe('formatUKCurrency', () => {
    it('renders GBP with the pound symbol and two decimals', () => {
      expect(formatUKCurrency(45)).toBe('£45.00');
    });

    it('adds a thousands separator', () => {
      expect(formatUKCurrency(1299.5)).toBe('£1,299.50');
    });

    it('handles zero', () => {
      expect(formatUKCurrency(0)).toBe('£0.00');
    });
  });

  describe('getUKTimezone', () => {
    it('returns Europe/London', () => {
      expect(getUKTimezone()).toBe('Europe/London');
      expect(getUKTimezone()).toBe(UK_TIMEZONE);
    });
  });

  it('exposes GBP as the currency code', () => {
    expect(UK_CURRENCY).toBe('GBP');
  });
});
