/**
 * Date utilities for consistent date handling
 */

export class DateUtils {
  /**
   * Get current ISO string
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * Add days to current date
   */
  static addDays(days: number, fromDate?: Date): Date {
    const date = fromDate || new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Add minutes to current date
   */
  static addMinutes(minutes: number, fromDate?: Date): Date {
    const date = fromDate || new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  /**
   * Format date with optional format string
   */
  static format(date: Date, formatString?: string): string {
    if (!formatString) {
      // Default to YYYY-MM-DD format
      return date.toISOString().split('T')[0];
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return formatString
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Format date for display (YYYY-MM-DD)
   */
  static formatDisplay(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse ISO string to Date
   */
  static parse(isoString: string): Date | null {
    const date = new Date(isoString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Get days between two dates
   */
  static daysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get business days between two dates (excludes weekends)
   */
  static businessDaysBetween(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }
}