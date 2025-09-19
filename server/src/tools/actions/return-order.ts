/**
 * Return Order Tool
 * Processes returns for an existing order
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class ReturnOrderTool extends BaseTool {
  name = 'return-order';
  
  description = 'Initiates a product return when customers want to send items back. Use when: processing return requests, handling damaged goods, managing buyer\'s remorse cases, or exchanging wrong items. Creates RMA (Return Merchandise Authorization) and tracks return status. Specify items, quantities, reason, and refund method.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the order to process return for (required)'
      },
      items: {
        type: 'array',
        description: 'Items to return',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            lineItemId: {
              type: 'string',
              description: 'Line item ID from original order'
            },
            sku: {
              type: 'string',
              description: 'Product SKU being returned'
            },
            quantity: {
              type: 'number',
              minimum: 1,
              description: 'Quantity to return'
            },
            reason: {
              type: 'string',
              description: 'Reason for return',
              enum: [
                'defective',
                'damaged_in_shipping',
                'wrong_item',
                'not_as_described',
                'customer_changed_mind',
                'arrived_late',
                'duplicate_order',
                'quality_issue',
                'size_fit_issue',
                'other'
              ]
            },
            condition: {
              type: 'string',
              description: 'Condition of returned item',
              enum: ['new', 'opened', 'used', 'damaged', 'defective']
            },
            restockable: {
              type: 'boolean',
              description: 'Whether item can be restocked',
              default: true
            }
          },
          required: ['sku', 'quantity', 'reason']
        }
      },
      returnType: {
        type: 'string',
        description: 'Type of return processing',
        enum: ['refund', 'store_credit', 'exchange', 'repair'],
        default: 'refund'
      },
      refundShipping: {
        type: 'boolean',
        description: 'Whether to refund shipping costs',
        default: false
      },
      returnShippingPaidBy: {
        type: 'string',
        description: 'Who pays for return shipping',
        enum: ['customer', 'merchant', 'carrier'],
        default: 'customer'
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the return'
      }
    },
    required: ['orderId', 'items']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.returnOrder(input.orderId, input.items);
  }
}