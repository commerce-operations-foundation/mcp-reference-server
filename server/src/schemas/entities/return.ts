import { z } from 'zod';

import { ObjectProps, TagsSchema, CustomFieldsSchema, AddressSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

/**
 * Return line item with inspection and disposition tracking
 */
export const ReturnLineItemSchema = z
  .object({
    id: z.string().describe('Unique identifier for this return line item'),
    orderLineItemId: z.string().describe('Reference to the original order line item'),
    sku: z.string().describe('Product Variant SKU'),
    quantityReturned: z.number().min(1).describe('Quantity being returned'),

    // Return reason
    returnReason: z
      .string()
      .describe(
        'Primary return reason code (e.g., "defective", "wrong_item", "no_longer_needed", "size_issue", "quality_issue")'
      ),

    // Inspection (combines condition and disposition)
    inspection: z
      .object({
        conditionCategory: z.string().describe('Item condition grade after inspection'),
        dispositionOutcome: z.string().describe('Disposition decision for the returned item'),
        warehouseLocationId: z.string().describe('Warehouse bin/shelf location identifier for restocking'),
        note: z.string().describe('Inspection notes about item condition and disposition'),
        inspectedBy: z.string().describe('Who inspected the item'),
        inspectedAt: z.iso.datetime().describe('When item was inspected'),
        images: z.array(z.string().url()).describe('Photos of returned item condition'),
      })
      .partial(),

    // Financial
    unitPrice: z.number().describe('Original unit price from order'),
    refundAmount: z.number().min(0).describe('Refund amount for this line item'),
    restockFee: z.number().min(0).describe('Restocking fee charged for this line item'),

    // Metadata
    name: z.string().describe('Product name for display'),
  })
  .partial()
  .required(makeZodFieldMap(['orderLineItemId', 'sku', 'quantityReturned', 'returnReason'] as const));

export type ReturnLineItem = z.infer<typeof ReturnLineItemSchema>;

/**
 * Exchange line item - items customer wants in exchange
 */
export const ExchangeLineItemSchema = z
  .object({
    id: z.string().describe('Unique exchange line item identifier'),
    exchangeOrderId: z.string().describe('Order ID created for this exchange'),
    exchangeOrderName: z.string().describe('Order number/name for exchange order'),
    sku: z.string().describe('Product Variant SKU'),
    name: z.string().describe('Product name'),
    quantity: z.number().min(1).describe('Quantity requested'),
    unitPrice: z.number().describe('Unit price'),
  })
  .partial()
  .required(makeZodFieldMap(['sku', 'quantity'] as const));

export type ExchangeLineItem = z.infer<typeof ExchangeLineItemSchema>;

/**
 * Return shipping label information
 */
export const ReturnLabelSchema = z
  .object({
    status: z.string().describe('Label lifecycle status'),
    carrier: z.string().describe('Shipping carrier providing the label'),
    trackingNumber: z.string().describe('Tracking number for the return shipment'),
    url: z.string().url().describe('URL to download the shipping label'),
    rate: z.number().describe('Shipping cost for this label'),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .partial()
  .required(makeZodFieldMap(['carrier', 'trackingNumber'] as const));

export type ReturnLabel = z.infer<typeof ReturnLabelSchema>;

/**
 * Return method (how customer returns items)
 */
export const ReturnMethodSchema = z
  .object({
    provider: z.string().describe('Return logistics provider'),
    methodType: z.string().describe('Method customer uses to return items'),
    address: AddressSchema.describe('Address where customer returns items'),
    qrCodeUrl: z.string().url().describe('QR code URL for label-free return methods'),
    updatedAt: z.iso.datetime(),
  })
  .partial();

export type ReturnMethod = z.infer<typeof ReturnMethodSchema>;

/**
 * Main Return entity schema
 */
const ReturnCoreSchema = z
  .object({
    // Identifiers
    returnNumber: z
      .string()
      .describe('Customer-facing return identifier used for tracking and reference (e.g., "RET-12345")'),
    orderId: z.string().describe('ID of the original order being returned'),

    // Status and outcome
    status: z.string().describe('Return processing status in the return lifecycle'),
    outcome: z.string().describe('What the customer receives for their return'),

    // Items
    returnLineItems: z.array(ReturnLineItemSchema).describe('Items being returned'),
    exchangeLineItems: z.array(ExchangeLineItemSchema).describe('Items being exchanged'),
    totalQuantity: z.number().describe('Total quantity of items being returned (excludes exchange items)'),

    // Return method and shipping
    returnMethod: ReturnMethodSchema,
    returnShippingAddress: AddressSchema.describe('Address where items should be returned to'),
    labels: z.array(ReturnLabelSchema).describe('Shipping labels for this return'),
    locationId: z.string().describe('Warehouse facility identifier where return will be received'),

    // Financial
    returnTotal: z.number().describe('Gross merchandise value of returned items before fees'),
    exchangeTotal: z.number().describe('Gross merchandise value of exchange items before any credits applied'),
    refundAmount: z.number().describe('Final refund amount to customer after fees and restocking charges'),
    refundMethod: z.string().describe('Payment method for issuing the refund'),
    refundStatus: z.string().describe('Payment refund processing status (separate from return status)'),
    refundTransactionId: z.string().describe('Transaction ID for the refund'),
    shippingRefundAmount: z.number().describe('Amount of original shipping cost being refunded'),
    returnShippingFees: z.number().describe('Return shipping cost charged to customer (if applicable)'),
    restockingFee: z.number().describe('Total restocking fees charged to customer across all items'),

    // Dates
    requestedAt: z.iso.datetime().describe('When return was requested'),
    receivedAt: z.iso.datetime().describe('When returned items were received'),
    completedAt: z.iso.datetime().describe('When return was fully processed'),

    // Additional metadata
    customerNote: z.string().describe('Customer notes about the return'),
    internalNote: z.string().describe('Internal notes for staff'),
    returnInstructions: z.string().describe('Instructions provided to customer'),
    declineReason: z.string().describe('Reason if return was declined'),

    // Tracking
    statusPageUrl: z.string().url().describe('Customer-facing status tracking page'),

    tags: TagsSchema,
    customFields: CustomFieldsSchema,
  })
  .partial()
  .required(makeZodFieldMap(['orderId', 'outcome', 'returnLineItems'] as const))
  .extend(ObjectProps.shape)
  .describe('Return');

export const ReturnSchema = ObjectProps.extend(ReturnCoreSchema.shape).describe('Return');

export type Return = z.infer<typeof ReturnSchema>;
