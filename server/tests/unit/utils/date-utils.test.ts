import { DateUtils } from '../../../src/utils/date-utils';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
describe('DateUtils', () => {
  beforeEach(() => {
    // Set a fixed time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-08-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('now', () => {
    it('should return current ISO timestamp', () => {
      const now = DateUtils.now();
      expect(now).toBe('2023-08-15T10:30:00.000Z');
    });
  });

  describe('addMinutes', () => {
    it('should add minutes to current time by default', () => {
      const result = DateUtils.addMinutes(30);
      expect(result.toISOString()).toBe('2023-08-15T11:00:00.000Z');
    });

    it('should add minutes to specified date', () => {
      const baseDate = new Date('2023-08-15T09:00:00.000Z');
      const result = DateUtils.addMinutes(45, baseDate);
      expect(result.toISOString()).toBe('2023-08-15T09:45:00.000Z');
    });

    it('should subtract minutes with negative values', () => {
      const result = DateUtils.addMinutes(-15);
      expect(result.toISOString()).toBe('2023-08-15T10:15:00.000Z');
    });
  });

  describe('addDays', () => {
    it('should add days to current time by default', () => {
      const result = DateUtils.addDays(5);
      expect(result.toISOString()).toBe('2023-08-20T10:30:00.000Z');
    });

    it('should add days to specified date', () => {
      const baseDate = new Date('2023-08-15T10:30:00.000Z');
      const result = DateUtils.addDays(10, baseDate);
      expect(result.toISOString()).toBe('2023-08-25T10:30:00.000Z');
    });

    it('should subtract days with negative values', () => {
      const result = DateUtils.addDays(-3);
      expect(result.toISOString()).toBe('2023-08-12T10:30:00.000Z');
    });

    it('should handle month boundaries correctly', () => {
      const baseDate = new Date('2023-08-30T10:30:00.000Z');
      const result = DateUtils.addDays(5, baseDate);
      expect(result.toISOString()).toBe('2023-09-04T10:30:00.000Z');
    });
  });

  describe('format', () => {
    // Use local time in tests to avoid timezone issues
    const testDate = new Date(2023, 7, 15, 14, 25, 30); // Aug 15, 2023 14:25:30 local time

    it('should format date with default YYYY-MM-DD format', () => {
      const formatted = DateUtils.format(testDate);
      expect(formatted).toBe('2023-08-15');
    });

    it('should format date with custom format', () => {
      const formatted = DateUtils.format(testDate, 'YYYY-MM-DD HH:mm:ss');
      expect(formatted).toBe('2023-08-15 14:25:30');
    });

    it('should format date from ISO string', () => {
      const isoDate = new Date(2023, 7, 15); // Aug 15, 2023 local time
      const formatted = DateUtils.format(isoDate, 'DD/MM/YYYY');
      expect(formatted).toBe('15/08/2023');
    });

    it('should handle various format patterns', () => {
      expect(DateUtils.format(testDate, 'MM/DD/YYYY')).toBe('08/15/2023');
      expect(DateUtils.format(testDate, 'HH:mm')).toBe('14:25');
      expect(DateUtils.format(testDate, 'YYYY-MM-DD_HH-mm-ss')).toBe('2023-08-15_14-25-30');
    });
  });

  describe('businessDaysBetween', () => {
    it('should count business days correctly', () => {
      // Monday to Thursday (same week) - 4 business days
      const start = new Date(2023, 7, 14); // Monday, Aug 14
      const end = new Date(2023, 7, 17);   // Thursday, Aug 17
      
      const businessDays = DateUtils.businessDaysBetween(start, end);
      expect(businessDays).toBe(4); // Mon, Tue, Wed, Thu
    });

    it('should exclude weekends', () => {
      // Monday to Sunday (includes weekend)
      const start = new Date(2023, 7, 14); // Monday, Aug 14
      const end = new Date(2023, 7, 20);   // Sunday, Aug 20
      
      const businessDays = DateUtils.businessDaysBetween(start, end);
      expect(businessDays).toBe(5); // Mon, Tue, Wed, Thu, Fri (excludes Sat, Sun)
    });

    it('should handle same day', () => {
      const date = new Date(2023, 7, 15); // Tuesday, Aug 15
      const businessDays = DateUtils.businessDaysBetween(date, date);
      expect(businessDays).toBe(1);
    });

    it('should handle weekend-only range', () => {
      const start = new Date(2023, 7, 19); // Saturday, Aug 19
      const end = new Date(2023, 7, 19);   // Saturday, Aug 19 (same day)
      
      const businessDays = DateUtils.businessDaysBetween(start, end);
      expect(businessDays).toBe(0);
    });

    it('should handle multi-week ranges', () => {
      const start = new Date(2023, 7, 14); // Monday week 1, Aug 14
      const end = new Date(2023, 7, 24);   // Thursday week 2, Aug 24
      
      const businessDays = DateUtils.businessDaysBetween(start, end);
      expect(businessDays).toBe(9); // 5 days first week + 4 days second week
    });
  });

  describe('parse', () => {
    it('should parse valid ISO date string', () => {
      const result = DateUtils.parse('2023-08-15T10:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-08-15T10:30:00.000Z');
    });

    it('should parse valid date string formats', () => {
      const result1 = DateUtils.parse('2023-08-15');
      const result2 = DateUtils.parse('August 15, 2023');
      
      expect(result1).toBeInstanceOf(Date);
      expect(result2).toBeInstanceOf(Date);
    });

    it('should return null for invalid date strings', () => {
      const result1 = DateUtils.parse('invalid-date');
      const result2 = DateUtils.parse('2023-13-45'); // Invalid month/day
      const result3 = DateUtils.parse('');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('should handle edge cases', () => {
      const result1 = DateUtils.parse('NaN');
      const result2 = DateUtils.parse('undefined');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});