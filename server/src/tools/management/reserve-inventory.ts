/**
 * Reserve Inventory Tool
 * Reserves inventory for order fulfillment
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class ReserveInventoryTool extends BaseTool {
  name = 'reserve-inventory';
  
  description = 'Temporarily locks inventory to guarantee availability during multi-step processes. Use when: holding items during checkout, B2B quote validity periods, preventing race conditions in high-volume sales, or coordinating multi-channel inventory. Set reservation duration and auto-release rules. Different from order creation which auto-reserves - this is for explicit inventory holds.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'Items to reserve',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            sku: {
              type: 'string',
              description: 'Product SKU to reserve (required)'
            },
            quantity: {
              type: 'number',
              minimum: 1,
              description: 'Quantity to reserve (required)'
            },
            locationId: {
              type: 'string',
              description: 'Warehouse or location ID',
              default: 'default'
            },
            priority: {
              type: 'string',
              description: 'Reservation priority',
              enum: ['low', 'normal', 'high', 'urgent'],
              default: 'normal'
            },
            notes: {
              type: 'string',
              description: 'Notes about this reservation'
            }
          },
          required: ['sku', 'quantity']
        }
      },
      duration: {
        type: 'number',
        description: 'Reservation duration in minutes',
        minimum: 1,
        maximum: 10080,
        default: 15
      },
      reservationReason: {
        type: 'string',
        description: 'Reason for inventory reservation',
        enum: [
          'order_processing',
          'order_fulfillment',
          'quality_check',
          'customer_hold',
          'system_maintenance',
          'audit_count',
          'transfer_preparation',
          'promotional_hold',
          'other'
        ]
      },
      orderId: {
        type: 'string',
        description: 'Associated order ID (if applicable)'
      },
      customerId: {
        type: 'string',
        description: 'Associated customer ID (if applicable)'
      },
      autoRelease: {
        type: 'boolean',
        description: 'Whether to automatically release reservation when duration expires',
        default: true
      },
      allowPartialReservation: {
        type: 'boolean',
        description: 'Whether to allow partial reservations if full quantity unavailable',
        default: false
      },
      reservationGroup: {
        type: 'string',
        description: 'Group identifier for related reservations'
      }
    },
    required: ['items']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    const reservation = {
      items: input.items,
      expiresInMinutes: input.duration || 15
    };
    return this.serviceLayer.reserveInventory(reservation);
  }
}