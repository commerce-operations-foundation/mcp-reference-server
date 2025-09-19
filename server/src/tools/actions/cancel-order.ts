/**
 * Cancel Order Tool
 * Cancels an existing order in the system
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class CancelOrderTool extends BaseTool {
  name = 'cancel-order';
  
  description = 'Cancels an order to stop fulfillment and release reserved inventory. Use when: customer requests cancellation, payment fails, fraud is detected, or items become unavailable. Only works for orders not yet shipped. Triggers: inventory release, refund processing, and customer notifications based on configuration.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the order to cancel (required)'
      },
      reason: {
        type: 'string',
        description: 'Reason for cancellation',
        enum: [
          'customer_request',
          'payment_failed',
          'fraud_detected',
          'inventory_unavailable',
          'address_undeliverable',
          'business_decision',
          'system_error',
          'other'
        ]
      },
      notifyCustomer: {
        type: 'boolean',
        description: 'Whether to send cancellation notification to customer',
        default: true
      },
      refundAmount: {
        type: 'number',
        description: 'Specific refund amount (optional - defaults to full order amount)',
        minimum: 0
      }
    },
    required: ['orderId']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.cancelOrder(input.orderId, input.reason);
  }
}