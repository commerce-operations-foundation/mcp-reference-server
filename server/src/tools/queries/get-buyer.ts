/**
 * Get Buyer Tool
 * Retrieves buyer/user information by ID
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class GetBuyerTool extends BaseTool {
  name = 'get-buyer';
  
  description = 'Retrieves system user account details for authentication and authorization purposes. Use when: verifying user permissions, checking account status, auditing user actions, or managing B2B buyer accounts. Note: This is for system users/buyers, not end customers - use get-customer for customer data.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      buyerId: {
        type: 'string',
        description: 'Unique buyer/user ID in the system (required)'
      }
    },
    required: ['buyerId']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getBuyer(input.buyerId);
  }
}