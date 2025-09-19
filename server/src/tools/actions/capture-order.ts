/**
 * Capture Order Tool
 * Creates a new order in the system
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class CaptureOrderTool extends BaseTool {
  name = 'capture-order';
  
  description = 'Creates a new order when a customer completes checkout or when importing orders from external systems. Use when: processing new purchases, migrating orders from other platforms, or creating manual orders. Automatically reserves inventory and initiates fulfillment workflow. Required: external order ID and line items with SKUs, quantities, and prices.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      order: {
        type: 'object',
        properties: {
          extOrderId: {
            type: 'string',
            description: 'External order ID from the source system (required)'
          },
          customer: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              customerId: { type: 'string' },
              extCompanyCustomerId: { type: 'string' },
              extCustomerId: { type: 'string' },
              extLocationCustomerId: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['individual', 'company'],
                description: 'Customer type'
              }
            }
          },
          lineItems: {
            type: 'array',
            description: 'Order line items (use lineItems instead of items per schema)',
            items: {
              type: 'object',
              properties: {
                sku: {
                  type: 'string',
                  description: 'Product SKU (required)',
                  minLength: 1
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity ordered (required)',
                  minimum: 1
                },
                unitPrice: {
                  type: 'number',
                  description: 'Price per unit (required)',
                  minimum: 0
                },
                name: {
                  type: 'string',
                  description: 'Product name for display'
                },
                totalPrice: {
                  type: 'number',
                  description: 'Total price (calculated if not provided)',
                  minimum: 0
                }
              },
              required: ['sku', 'quantity', 'unitPrice']
            }
          },
          billingAddress: {
            type: 'object',
            properties: {
              address1: { type: 'string' },
              city: { type: 'string' },
              stateOrProvince: { type: 'string' },
              zipCodeOrPostalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          shippingAddress: {
            type: 'object',
            properties: {
              address1: { type: 'string' },
              city: { type: 'string' },
              stateOrProvince: { type: 'string' },
              zipCodeOrPostalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          currency: { type: 'string' }
        },
        required: ['extOrderId']
      }
    },
    required: ['order']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.captureOrder(input.order);
  }
}