/**
 * Inventory Service
 * Handles all inventory-related operations including reservations and queries
 */

import { IFulfillmentAdapter } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { TimeoutHandler } from '../utils/timeout.js';
import { ErrorHandler } from './error-handler.js';
import { FulfillmentToolResult } from '../types/adapter.js';
import { GetInventoryInput, InventoryItem } from '../schemas/index.js';

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
  async getInventory(input: GetInventoryInput): Promise<FulfillmentToolResult<{ inventory: InventoryItem[] }>> {
    return this.errorHandler.executeOperation('getInventory', async () => {
      const result = await TimeoutHandler.withTimeout(() => this.adapter.getInventory(input), 'adapter');

      if (result.success) {
        Logger.debug('Inventory retrieved successfully', { count: result.inventory.length });
        return result;
      } else {
        Logger.error('Failed to retrieve inventory', { error: result.error });
        throw result.error;
      }
    });
  }
}
