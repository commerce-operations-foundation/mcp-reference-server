/**
 * Ship Order Tool
 * Processes shipment of an order
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class ShipOrderTool extends BaseTool {
  name = 'ship-order';
  
  description = 'Marks an order as shipped and creates tracking records when items leave the warehouse. Use when: warehouse confirms dispatch, carrier picks up package, or dropshipper provides tracking. Creates shipment record with tracking info and updates order status. Required: order ID, carrier, tracking number, and shipped items.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the order to ship (required)'
      },
      shippingInfo: {
        type: 'object',
        description: 'Shipping details',
        properties: {
          carrier: {
            type: 'string',
            description: 'Shipping carrier name',
            enum: ['USPS', 'UPS', 'FedEx', 'DHL', 'OnTrac', 'Other']
          },
          service: {
            type: 'string',
            description: 'Shipping service level',
            enum: [
              'ground',
              'standard',
              'expedited',
              'priority',
              'express',
              'overnight',
              'two_day',
              'economy'
            ]
          },
          trackingNumber: {
            type: 'string',
            description: 'Tracking number from carrier'
          },
          trackingUrl: {
            type: 'string',
            description: 'URL to track shipment',
            format: 'uri'
          },
          estimatedDelivery: {
            type: 'string',
            description: 'Expected delivery date',
            format: 'date'
          },
          shippingCost: {
            type: 'number',
            description: 'Actual shipping cost',
            minimum: 0
          },
          weight: {
            type: 'number',
            description: 'Package weight in pounds',
            minimum: 0
          },
          dimensions: {
            type: 'object',
            description: 'Package dimensions',
            properties: {
              length: { type: 'number', minimum: 0 },
              width: { type: 'number', minimum: 0 },
              height: { type: 'number', minimum: 0 },
              unit: { type: 'string', enum: ['in', 'cm'], default: 'in' }
            }
          }
        },
        required: ['carrier', 'service']
      },
      items: {
        type: 'array',
        description: 'Items included in this shipment (for partial shipments)',
        items: {
          type: 'object',
          properties: {
            lineItemId: {
              type: 'string',
              description: 'Line item ID from order'
            },
            sku: {
              type: 'string',
              description: 'Product SKU'
            },
            quantity: {
              type: 'number',
              minimum: 1,
              description: 'Quantity being shipped'
            }
          },
          required: ['sku', 'quantity']
        }
      },
      shippingAddress: {
        type: 'object',
        description: 'Shipping address (if different from order address)',
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
      notifyCustomer: {
        type: 'boolean',
        description: 'Whether to send shipping notification to customer',
        default: true
      },
      notes: {
        type: 'string',
        description: 'Additional shipping notes'
      }
    },
    required: ['orderId', 'shippingInfo']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.shipOrder(input.orderId, input.shippingInfo);
  }
}