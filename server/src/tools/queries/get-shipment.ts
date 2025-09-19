/**
 * Get Shipment Tool
 * Retrieves shipment information by identifier
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class GetShipmentTool extends BaseTool {
  name = 'get-shipment';
  
  description = 'Retrieves shipping details and tracking information for customer updates or delivery verification. Use when: answering "where is my order" inquiries, providing tracking updates, verifying delivery completion, or investigating shipping issues. Searches by shipment ID, order ID, or carrier tracking number.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      identifier: {
        type: 'object',
        description: 'Shipment identifier - at least one field required',
        properties: {
          shipmentId: {
            type: 'string',
            description: 'Unique shipment ID in the Fulfillment System'
          },
          orderId: {
            type: 'string',
            description: 'Order ID associated with the shipment'
          },
          trackingNumber: {
            type: 'string',
            description: 'Carrier tracking number'
          }
        },
        minProperties: 1,
        additionalProperties: false
      }
    },
    required: ['identifier']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getShipment(input.identifier);
  }
}