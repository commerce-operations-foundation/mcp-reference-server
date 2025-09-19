/**
 * Update Order Tool
 * Updates properties of an existing order
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class UpdateOrderTool extends BaseTool {
  name = 'update-order';
  
  description = 'Modifies order details when corrections or changes are needed before fulfillment. Use when: correcting addresses, updating quantities, changing shipping methods, or adding notes. Restrictions apply based on order status - shipped orders have limited editability. Check order status first with get-order.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the order to update (required)'
      },
      updates: {
        type: 'object',
        description: 'Fields to update',
        properties: {
          billingAddress: {
            type: 'object',
            description: 'Updated billing address',
            properties: {
              address1: { type: 'string' },
              address2: { type: 'string' },
              city: { type: 'string' },
              stateOrProvince: { type: 'string' },
              zipCodeOrPostalCode: { type: 'string' },
              country: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          shippingAddress: {
            type: 'object',
            description: 'Updated shipping address',
            properties: {
              address1: { type: 'string' },
              address2: { type: 'string' },
              city: { type: 'string' },
              stateOrProvince: { type: 'string' },
              zipCodeOrPostalCode: { type: 'string' },
              country: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          lineItems: {
            type: 'array',
            description: 'Updated line items (replaces existing)',
            items: {
              type: 'object',
              properties: {
                lineItemId: { type: 'string' },
                sku: { type: 'string' },
                quantity: { type: 'number', minimum: 0 },
                unitPrice: { type: 'number', minimum: 0 },
                name: { type: 'string' }
              }
            }
          },
          customFields: {
            type: 'array',
            description: 'Custom field updates',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: { type: 'string' }
              },
              required: ['name', 'value']
            }
          },
          priority: {
            type: 'string',
            description: 'Order priority level',
            enum: ['low', 'normal', 'high', 'urgent']
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the order'
          }
        },
        minProperties: 1
      }
    },
    required: ['orderId', 'updates']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.updateOrder(input.orderId, input.updates);
  }
}