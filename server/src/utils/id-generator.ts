/**
 * ID Generation utilities
 */

import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

export class IdGenerator {
  private static counters: Map<string, number> = new Map();

  /**
   * Generate a UUID string
   */
  static uuid(): string {
    return uuidv4();
  }

  /**
   * Generate an order ID
   */
  static orderId(): string {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    const suffix = this.random(4, true);
    return `ORD-${timestamp}-${suffix}`;
  }

  /**
   * Generate a shipment ID
   */
  static fulfillmentId(): string {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    const suffix = this.random(4, true);
    return `SHP-${timestamp}-${suffix}`;
  }

  /**
   * Generate a reservation ID
   */
  static reservationId(): string {
    const suffix = this.random(8, true);
    return `RSV-${suffix}`;
  }

  /**
   * Generate an RMA number
   */
  static rmaNumber(): string {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    const suffix = this.random(4, true);
    return `RMA-${timestamp}-${suffix}`;
  }

  /**
   * Generate a sequential ID with prefix
   */
  static sequential(prefix: string): string {
    const count = this.counters.get(prefix) || 0;
    const newCount = count + 1;
    this.counters.set(prefix, newCount);
    return `${prefix}-${newCount.toString().padStart(6, '0')}`;
  }

  /**
   * Generate a random string using cryptographically secure randomness
   */
  static random(length: number, alphaOnly: boolean = false): string {
    const chars = alphaOnly ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' : 'abcdefghijklmnopqrstuvwxyz0123456789';

    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * Reset counters (useful for testing)
   */
  static resetCounters(): void {
    this.counters.clear();
  }
}
