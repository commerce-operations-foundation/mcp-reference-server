/**
 * Get Order Tool
 * Retrieves order information by ID or external ID
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { OrderIdentifier } from '../../types/index.js';

export class GetOrdersTool extends BaseTool {
  name = 'get-orders';
  
  description = 'Retrieves orders details when you need to check order status, view line items, track fulfillment progress, or investigate customer inquiries. Use when: displaying order information, verifying order existence, checking shipping status, or before performing order modifications. Accepts order ID, external ID, or order number.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderIds: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Internal order ID, could be a comma separated list'
      },
      extOrderIds: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'External order ID from source system, could be a comma separated list'
      },
      statuses: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Order status'
      },
      orderNames: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Friendly Order identifier'
      },
      updatedAtMin: {
        type: 'string',
        format: 'date-time',
        description: 'Minimum updated at date'
      },
      updatedAtMax: {
        type: 'string',
        format: 'date-time',
        description: 'Maximum updated at date'
      },
      pageSize: {
        type: 'number',
        description: 'Page size',
        default: 10
      },
      skip: {
        type: 'number',
        description: 'Skip',
        default: 0
      },
      includeLineItems: {
        type: 'boolean',
        description: 'Whether to include detailed line item information',
        default: true
      },
      includeShipments: {
        type: 'boolean',
        description: 'Whether to include shipment information',
        default: true
      },
      includePayments: {
        type: 'boolean',
        description: 'Whether to include payment information',
        default: false
      },
      includeHistory: {
        type: 'boolean',
        description: 'Whether to include order status history',
        default: false
      }
    },
    anyOf: [
      { required: ['orderId'] },
      { required: ['extOrderId'] },
      { required: ['orderNumber'] }
    ]
  };

  async execute(input: any): Promise<any> {
    // If orderNumber is provided, try it as both orderId and extOrderId
    // since the Order schema doesn't have an orderNumber field
    const identifier: OrderIdentifier = {
      orderId: input.orderId,
      extOrderId: input.extOrderId,
      orderNumber: input.orderNumber
    };
    
    // If only orderNumber is provided, try it as extOrderId first (most common case)
    if (input.orderNumber && !input.orderId && !input.extOrderId) {
      try {
        // First try as extOrderId (e.g., "ORD-1001")
        const result = await this.serviceLayer.getOrder({ extOrderId: input.orderNumber });
        return result;
      } catch {
        // If not found, try as orderId (e.g., "order_001")
        try {
          const result = await this.serviceLayer.getOrder({ orderId: input.orderNumber });
          return result;
        } catch {
          // If still not found, pass through original identifier for proper error message
          // This will trigger the standard "Order not found" error with the orderNumber
        }
      }
    }
    
    return this.serviceLayer.getOrder(identifier);
  }
}
