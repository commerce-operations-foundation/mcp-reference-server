/**
 * Get Customer Tool
 * Retrieves customer information by identifier
 */

import { BaseTool } from "../base-tool.js";
import { JSONSchema } from "../../types/mcp.js";

export class GetCustomerTool extends BaseTool {
  name = "get-customer";

  description =
    "Retrieves customer profile and history when you need to verify customer identity, check purchase history, or validate customer data. Use when: processing customer service requests, verifying customer eligibility, personalizing experiences, or before order creation. Searches by customer ID or email.";

  inputSchema: JSONSchema = {
    type: "object",
    description: "Customer identifier - at least one field required",

    ids: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Unique customer ID in the Fulfillment System",
    },
    emails: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Customer email address",
      format: "email",
    },
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getCustomer(input.identifier);
  }
}
