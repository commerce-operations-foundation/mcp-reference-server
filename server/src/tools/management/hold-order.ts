/**
 * Hold Order Tool
 * Places an order on hold temporarily
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class HoldOrderTool extends BaseTool {
  name = 'hold-order';
  
  description = 'Temporarily stops order processing for review or verification. Use when: payment needs verification, address looks suspicious, fraud flags trigger, inventory issues arise, or customer requests delay. Prevents shipping while preserving order state. Set hold reason, auto-release time, and notification preferences. Must be manually released or will auto-release at specified time.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the order to place on hold (required)'
      },
      reason: {
        type: 'string',
        description: 'Reason for placing order on hold',
        enum: [
          'payment_verification',
          'address_verification',
          'fraud_review',
          'inventory_check',
          'customer_request',
          'compliance_review',
          'quality_assurance',
          'manual_review',
          'system_maintenance',
          'other'
        ]
      },
      releaseDate: {
        type: 'string',
        description: 'Date when hold should be automatically released (ISO 8601)',
        format: 'date-time'
      },
      priority: {
        type: 'string',
        description: 'Priority level for hold resolution',
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
      },
      assignedTo: {
        type: 'string',
        description: 'User ID or team responsible for resolving hold'
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the hold'
      },
      notifyCustomer: {
        type: 'boolean',
        description: 'Whether to notify customer about the hold',
        default: false
      },
      allowPartialRelease: {
        type: 'boolean',
        description: 'Whether individual line items can be released separately',
        default: false
      }
    },
    required: ['orderId', 'reason']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    const holdParams = {
      reason: input.reason,
      releaseDate: input.releaseDate,
      priority: input.priority,
      assignedTo: input.assignedTo,
      notes: input.notes,
      allowPartialRelease: input.allowPartialRelease
    };
    
    return this.serviceLayer.holdOrder(input.orderId, holdParams);
  }
}