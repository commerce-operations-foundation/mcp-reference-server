/**
 * Get Shipment Tool
 * Retrieves shipment information by identifier
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class GetShipmentTool extends BaseTool {
  name = 'get-fulillments';
  
  description = 'Retrieves shipping details and tracking information for customer updates or delivery verification. Use when: answering "where is my order" inquiries, providing tracking updates, verifying delivery completion, or investigating shipping issues. Searches by shipment ID, order ID, or carrier tracking number.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
          ids: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Unique shipment ID in the Fulfillment System'
          },
          orderIds: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Order ID associated with the shipment'
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
          }
        }
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getShipment(input.identifier);
  }
}