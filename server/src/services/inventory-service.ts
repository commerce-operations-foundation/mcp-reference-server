/**
 * Inventory Service
 * Handles all inventory-related operations including reservations and queries
 */

import { 
  IFulfillmentAdapter, 
  Inventory,
  ReservationRequest,
  ReservationResult
} from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { Sanitizer } from '../utils/index.js';
import { TimeoutHandler } from '../utils/timeout.js';
import { ErrorHandler } from './error-handler.js';

export class InventoryService {
  constructor(
    private adapter: IFulfillmentAdapter,
    private errorHandler: ErrorHandler
  ) {
    Logger.debug('InventoryService initialized');
  }

  /**
   * Get inventory for a SKU
   */
  async getInventory(sku: string, locationId?: string): Promise<Inventory> {
    return this.errorHandler.executeOperation('getInventory', async () => {
      const sanitizedSku = Sanitizer.string(sku);
      const sanitizedLocationId = locationId ? Sanitizer.string(locationId) : undefined;
      
      if (!sanitizedSku) {
        throw new ValidationError('sku', 'SKU is required');
      }

      Logger.debug('Getting inventory', { sku: sanitizedSku, locationId: sanitizedLocationId });
      
      const inventory = await TimeoutHandler.withTimeout(
        () => this.adapter.getInventory(sanitizedSku, sanitizedLocationId),
        'adapter'
      );
      
      Logger.debug('Inventory retrieved successfully', { 
        sku: sanitizedSku, 
        available: inventory.available 
      });
      
      return inventory;
    });
  }

  /**
   * Reserve inventory for items
   */
  async reserveInventory(reservation: ReservationRequest): Promise<ReservationResult> {
    return this.errorHandler.executeOperation('reserveInventory', async () => {
      // Validate reservation request
      if (!reservation.items || reservation.items.length === 0) {
        throw new ValidationError('items', 'Reservation items are required');
      }

      // Sanitize items
      const sanitizedItems = reservation.items.map(item => ({
        sku: Sanitizer.string(item.sku),
        quantity: item.quantity,
        locationId: item.locationId ? Sanitizer.string(item.locationId) : undefined
      }));

      const sanitizedReservation = {
        ...reservation,
        items: sanitizedItems,
        expiresInMinutes: reservation.expiresInMinutes || 30
      };

      Logger.info('Reserving inventory', { 
        itemCount: sanitizedReservation.items.length,
        expiresInMinutes: sanitizedReservation.expiresInMinutes
      });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.reserveInventory(sanitizedReservation),
        'adapter'
      );
      
      Logger.info('Inventory reserved successfully', { 
        reservationId: result.reservationId, 
        expiresAt: result.expiresAt 
      });
      
      return result;
    });
  }

  /**
   * Release inventory reservation
   */
  async releaseReservation(reservationId: string): Promise<void> {
    return this.errorHandler.executeOperation('releaseReservation', async () => {
      const sanitizedReservationId = Sanitizer.string(reservationId);
      if (!sanitizedReservationId) {
        throw new ValidationError('reservationId', 'Reservation ID is required');
      }

      Logger.info('Releasing inventory reservation', { 
        reservationId: sanitizedReservationId 
      });
      
      const releaseFn = this.adapter.releaseReservation;
      if (releaseFn) {
        await TimeoutHandler.withTimeout(
          () => releaseFn.call(this.adapter, sanitizedReservationId),
          'adapter'
        );
      } else {
        Logger.warn('Adapter does not support releaseReservation');
        throw new Error('Release reservation not supported by adapter');
      }
      
      Logger.info('Inventory reservation released successfully', { 
        reservationId: sanitizedReservationId 
      });
    });
  }

  /**
   * Check inventory availability for multiple SKUs
   */
  async checkAvailability(skus: string[], locationId?: string): Promise<Map<string, Inventory>> {
    return this.errorHandler.executeOperation('checkAvailability', async () => {
      if (!skus || skus.length === 0) {
        throw new ValidationError('skus', 'SKUs list is required');
      }

      const sanitizedSkus = skus
        .map(sku => Sanitizer.string(sku))
        .filter((sku): sku is string => Boolean(sku));
      const sanitizedLocationId = locationId ? Sanitizer.string(locationId) : undefined;
      
      if (sanitizedSkus.length === 0) {
        throw new ValidationError('skus', 'All SKUs were invalid');
      }
      
      Logger.debug('Checking inventory availability', { 
        skuCount: sanitizedSkus.length, 
        locationId: sanitizedLocationId 
      });
      
      const inventoryMap = new Map<string, Inventory>();
      
      // Fetch inventory for each SKU
      // Note: Could be optimized with batch API if adapter supports it
      await Promise.all(
        sanitizedSkus.map(async (sku) => {
          try {
            const inventory = await TimeoutHandler.withTimeout(
              () => this.adapter.getInventory(sku, sanitizedLocationId),
              'adapter'
            );
            inventoryMap.set(sku, inventory);
          } catch (error) {
            Logger.warn(`Failed to get inventory for SKU: ${sku}`, { error });
            // Set unavailable inventory for failed SKUs
            inventoryMap.set(sku, {
              sku,
              available: 0,
              reserved: 0,
              onHand: 0,
              locationId: sanitizedLocationId
            });
          }
        })
      );
      
      Logger.debug('Inventory availability check completed', { 
        successfulChecks: inventoryMap.size 
      });
      
      return inventoryMap;
    });
  }

  /**
   * Adjust inventory levels
   */
  async adjustInventory(
    sku: string, 
    adjustment: number, 
    reason: string,
    locationId?: string
  ): Promise<Inventory> {
    return this.errorHandler.executeOperation('adjustInventory', async () => {
      const sanitizedSku = Sanitizer.string(sku);
      const sanitizedReason = Sanitizer.string(reason);
      const sanitizedLocationId = locationId ? Sanitizer.string(locationId) : undefined;
      
      if (!sanitizedSku) {
        throw new ValidationError('sku', 'SKU is required');
      }
      
      if (!sanitizedReason) {
        throw new ValidationError('reason', 'Adjustment reason is required');
      }

      Logger.info('Adjusting inventory', { 
        sku: sanitizedSku, 
        adjustment, 
        reason: sanitizedReason,
        locationId: sanitizedLocationId 
      });
      
      const adjustFn = this.adapter.adjustInventory;
      if (!adjustFn) {
        Logger.warn('Adapter does not support adjustInventory');
        throw new Error('Adjust inventory not supported by adapter');
      }
      
      const result = await TimeoutHandler.withTimeout(
        () => adjustFn.call(
          this.adapter,
          sanitizedSku,
          adjustment,
          sanitizedReason,
          sanitizedLocationId
        ),
        'adapter'
      );
      
      Logger.info('Inventory adjusted successfully', { 
        sku: sanitizedSku, 
        newAvailable: result.available 
      });
      
      return result;
    });
  }

  /**
   * Transfer inventory between locations
   */
  async transferInventory(
    sku: string,
    quantity: number,
    fromLocationId: string,
    toLocationId: string,
    reason?: string
  ): Promise<{ from: Inventory; to: Inventory }> {
    return this.errorHandler.executeOperation('transferInventory', async () => {
      const sanitizedSku = Sanitizer.string(sku);
      const sanitizedFromLocationId = Sanitizer.string(fromLocationId);
      const sanitizedToLocationId = Sanitizer.string(toLocationId);
      const sanitizedReason = reason ? Sanitizer.string(reason) : undefined;
      
      if (!sanitizedSku) {
        throw new ValidationError('sku', 'SKU is required');
      }
      
      if (quantity <= 0) {
        throw new ValidationError('quantity', 'Transfer quantity must be positive');
      }
      
      if (!sanitizedFromLocationId || !sanitizedToLocationId) {
        throw new ValidationError('locationId', 'Both source and destination locations are required');
      }

      Logger.info('Transferring inventory', { 
        sku: sanitizedSku, 
        quantity,
        fromLocationId: sanitizedFromLocationId,
        toLocationId: sanitizedToLocationId,
        reason: sanitizedReason 
      });
      
      const transferFn = this.adapter.transferInventory;
      if (!transferFn) {
        Logger.warn('Adapter does not support transferInventory');
        throw new Error('Transfer inventory not supported by adapter');
      }

      const result = await TimeoutHandler.withTimeout(
        () => transferFn.call(
          this.adapter,
          sanitizedSku,
          quantity,
          sanitizedFromLocationId,
          sanitizedToLocationId,
          sanitizedReason
        ),
        'adapter'
      );
      
      Logger.info('Inventory transferred successfully', { 
        sku: sanitizedSku,
        fromAvailable: result.from.available,
        toAvailable: result.to.available
      });
      
      return result;
    });
  }
}
