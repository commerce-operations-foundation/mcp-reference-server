/**
 * Data transformer for converting between MCP format and adapter format
 */

import { Logger } from '../utils/logger.js';
import { Sanitizer } from '../utils/sanitizer.js';
import * as types from '../types/index.js';

export class Transformer {
  /**
   * Transform data to adapter format
   */
  toAdapterFormat(type: string, data: any): any {
    switch (type) {
      case 'order':
        return this.transformOrderToAdapter(data);
      case 'customer':
        return this.transformCustomerToAdapter(data);
      case 'address':
        return this.transformAddressToAdapter(data);
      case 'product':
        return this.transformProductToAdapter(data);
      default:
        Logger.warn(`Unknown transformation type: ${type}`);
        return data;
    }
  }
  
  /**
   * Transform data to MCP format
   */
  toMCPFormat(type: string, data: any): any {
    switch (type) {
      case 'order':
        return this.transformOrderToMCP(data);
      case 'orderResult':
        return this.transformOrderResultToMCP(data);
      case 'customer':
        return this.transformCustomerToMCP(data);
      case 'product':
        return this.transformProductToMCP(data);
      default:
        Logger.warn(`Unknown transformation type: ${type}`);
        return data;
    }
  }
  
  /**
   * Transform order data to adapter format
   */
  private transformOrderToAdapter(order: any): any {
    if (!order) {
      Logger.warn('Attempted to transform null/undefined order to adapter format');
      return null;
    }

    return {
      extOrderId: order.extOrderId,
      customer: this.transformCustomerToAdapter(order.customer),
      lineItems: order.lineItems?.map((item: any) => ({
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
        name: item.name,
        metadata: item.metadata || {}
      })),
      billingAddress: order.billingAddress ? 
        this.transformAddressToAdapter(order.billingAddress) : null,
      shippingAddress: order.shippingAddress ? 
        this.transformAddressToAdapter(order.shippingAddress) : null,
      currency: order.currency || 'USD',
      metadata: order.metadata || {},
      customFields: order.customFields || []
    };
  }
  
  /**
   * Transform customer data to adapter format
   */
  private transformCustomerToAdapter(customer: any): any {
    if (!customer) {return null;}
    
    const sanitizedEmail = customer.email ? Sanitizer.email(customer.email) : null;
    const sanitizedPhone = customer.phone ? Sanitizer.phone(customer.phone) : null;

    return {
      email: sanitizedEmail || customer.email, // Fall back to original if sanitization fails
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: sanitizedPhone,
      company: customer.company || null,
      customerId: customer.customerId || null
    };
  }
  
  /**
   * Transform address to adapter format
   */
  private transformAddressToAdapter(address: any): any {
    if (!address) {return null;}
    
    return {
      line1: address.address1 || address.street,
      line2: address.address2 || null,
      city: address.city,
      state: address.stateOrProvince || address.province,
      postalCode: address.zipCodeOrPostalCode || address.zip,
      country: address.country || 'US',
      phone: address.phone || null
    };
  }
  
  /**
   * Transform order from adapter to MCP format
   */
  private transformOrderToMCP(order: any): types.Order {
    if (!order) {
      Logger.warn('Attempted to transform null/undefined order to MCP format');
      return {} as types.Order;
    }

    return {
      orderId: order.orderId || order.id,
      extOrderId: order.extOrderId || order.externalOrderId || undefined,
      status: this.normalizeOrderStatus(order.status),
      customer: this.transformCustomerToMCP(order.customer),
      lineItems: (order.lineItems || order.items)?.map((item: any) => this.transformOrderItemToMCP(item)) || [],
      billingAddress: this.transformAddressToMCP(order.billingAddress),
      shippingAddress: this.transformAddressToMCP(order.shippingAddress),
      currency: order.currency || 'USD',
      subTotalPrice: order.subTotalPrice || order.subtotal || this.calculateSubtotal(order.lineItems || order.items),
      orderTax: order.orderTax !== undefined ? order.orderTax : (order.tax !== undefined ? order.tax : 0),
      shippingPrice: order.shippingPrice !== undefined ? order.shippingPrice : (order.shipping !== undefined ? order.shipping : 0),
      totalPrice: order.totalPrice || order.total || this.calculateTotal(order),
      createdAt: order.createdAt || order.created_at,
      updatedAt: order.updatedAt || order.updated_at,
      customFields: order.customFields || []
    };
  }
  
  /**
   * Transform order result to MCP format
   */
  private transformOrderResultToMCP(result: any): types.OrderResult {
    if (!result) {
      Logger.warn('Attempted to transform null/undefined order result to MCP format');
      return {} as types.OrderResult;
    }

    return {
      success: result.success !== false,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      status: this.normalizeOrderStatus(result.status),
      createdAt: result.createdAt || new Date().toISOString(),
      message: result.message || null
    };
  }
  
  /**
   * Transform customer from adapter to MCP format
   */
  private transformCustomerToMCP(customer: any): types.OrderCustomer | undefined {
    if (!customer) {return undefined;}
    
    return {
      customerId: customer.customerId || customer.custId || customer.id || undefined,
      extCustomerId: customer.extCustomerId || undefined,
      firstName: customer.firstName,
      lastName: customer.lastName,
      company: customer.company || null,
      type: customer.type === 'company' ? 'company' : 'individual'
    };
  }
  
  /**
   * Transform address from adapter to MCP format
   */
  private transformAddressToMCP(address: any): types.OrderAddress | undefined {
    if (!address) {return undefined;}
    
    return {
      address1: address.line1 || address.address1 || address.street,
      address2: address.line2 || address.address2 || null,
      city: address.city,
      stateOrProvince: address.state || address.stateOrProvince || address.province,
      zipCodeOrPostalCode: address.postalCode || address.zipCodeOrPostalCode || address.zip,
      country: address.country || 'US',
      phone: address.phone || null,
      email: address.email || null,
      firstName: address.firstName || null,
      lastName: address.lastName || null,
      company: address.company || null
    };
  }
  
  /**
   * Transform order item to MCP format
   */
  private transformOrderItemToMCP(item: any): types.OrderLineItem {
    if (!item) {
      Logger.warn('Attempted to transform null/undefined order item to MCP format');
      return {} as types.OrderLineItem;
    }

    const quantity = item.quantity || item.ordered || 0;

    return {
      lineItemId: item.lineItemId || item.id || '',
      sku: item.sku || item.productId || '',
      quantity: quantity,
      unitPrice: item.unitPrice || item.price || 0,
      totalPrice: item.totalPrice || (quantity * (item.unitPrice || item.price || 0)),
      name: item.name || item.productName,
      customFields: item.customFields || [],
      canceled: item.canceled || 0,
      fulfillable: item.fulfillable || quantity,
      fulfilled: item.fulfilled || 0,
      ordered: quantity
    };
  }
  
  /**
   * Normalize order status to standard values
   */
  private normalizeOrderStatus(status: string): string {
    if (!status) {return 'pending';}
    
    const normalized = status.toLowerCase().trim();
    
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'confirmed': 'confirmed', 
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'refunded': 'refunded',
      'on_hold': 'on_hold',
      'on-hold': 'on_hold',
      'hold': 'on_hold',
      'complete': 'delivered',
      'completed': 'delivered',
      'fulfilled': 'delivered'
    };
    
    return statusMap[normalized] || 'pending';
  }
  
  /**
   * Calculate subtotal from items
   */
  private calculateSubtotal(items: any[]): number {
    if (!items || items.length === 0) {return 0;}
    
    return items.reduce((sum, item) => {
      const quantity = item.quantity || item.ordered || 0;
      const price = item.totalPrice || (quantity * (item.unitPrice || item.price || 0));
      return sum + price;
    }, 0);
  }
  
  /**
   * Calculate total from order components
   */
  private calculateTotal(order: any): number {
    const subtotal = order.subtotal || order.subTotalPrice || this.calculateSubtotal(order.lineItems || order.items);
    const tax = order.tax || order.orderTax || 0;
    const shipping = order.shipping || order.shippingPrice || 0;
    const discount = order.discount || order.orderDiscount || 0;
    
    return subtotal + tax + shipping - discount;
  }

  /**
   * Transform product to adapter format
   */
  transformProductToAdapter(product: any): any {
    if (!product) {return null;}

    return {
      sku: product.sku,
      name: product.name,
      description: product.description || null,
      price: product.cost || 0,
      currency: product.costCurrency || 'USD',
      weight: product.weight || null,
      weightUnit: product.weightUnit || 'lb',
      dimensions: {
        length: product.length || null,
        width: product.width || null,
        height: product.height || null,
        unit: product.dimensionsUnit || 'in'
      },
      upc: product.upc || null,
      vendor: product.vendor || null,
      category: product.types?.[0] || null,
      tags: product.tags || {},
      customFields: product.customFields || []
    };
  }

  /**
   * Transform product from adapter to MCP format
   */
  transformProductToMCP(product: any): types.Product {
    if (!product) {
      Logger.warn('Attempted to transform null/undefined product to MCP format');
      return {} as types.Product;
    }

    return {
      productId: product.productId || product.id,
      sku: product.sku,
      name: product.name,
      description: product.description || null,
      cost: product.price || product.cost || 0,
      costCurrency: product.currency || product.costCurrency || 'USD',
      weight: product.weight || product.dimensions?.weight || null,
      weightUnit: product.weightUnit || 'lb',
      length: product.dimensions?.length || product.length || null,
      width: product.dimensions?.width || product.width || null,
      height: product.dimensions?.height || product.height || null,
      dimensionsUnit: product.dimensions?.unit || product.dimensionsUnit || 'in',
      upc: product.upc || null,
      vendor: product.vendor || null,
      types: product.category ? [product.category] : product.types || [],
      tags: product.tags || {},
      customFields: product.customFields || [],
      createdAt: product.createdAt || product.created_at,
      updatedAt: product.updatedAt || product.updated_at
    };
  }
}