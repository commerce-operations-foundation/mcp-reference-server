/**
 * Query Service
 * Handles all read-only query operations
 */

import { 
  IFulfillmentAdapter,
  Order,
  OrderIdentifier,
  Product,
  ProductIdentifier,
  Customer,
  CustomerIdentifier,
  Shipment,
  ShipmentIdentifier,
  OrderSearchFilters,
  ProductSearchFilters
} from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { Sanitizer } from '../utils/index.js';
import { TimeoutHandler } from '../utils/timeout.js';
import { ErrorHandler } from './error-handler.js';

export class QueryService {
  constructor(
    private adapter: IFulfillmentAdapter,
    private errorHandler: ErrorHandler
  ) {
    Logger.debug('QueryService initialized');
  }

  /**
   * Get order by identifier
   */
  async getOrder(identifier: OrderIdentifier): Promise<Order> {
    return this.errorHandler.executeOperation('getOrder', async () => {
      if (!identifier.orderId && !identifier.extOrderId && !identifier.orderNumber) {
        throw new ValidationError('identifier', 'At least one order identifier is required');
      }

      // Sanitize identifiers
      const sanitizedIdentifier: OrderIdentifier = {};
      if (identifier.orderId) {
        sanitizedIdentifier.orderId = Sanitizer.string(identifier.orderId);
      }
      if (identifier.extOrderId) {
        sanitizedIdentifier.extOrderId = Sanitizer.string(identifier.extOrderId);
      }
      if (identifier.orderNumber) {
        sanitizedIdentifier.orderNumber = Sanitizer.string(identifier.orderNumber);
      }

      Logger.debug('Getting order', { identifier: sanitizedIdentifier });
      
      const order = await TimeoutHandler.withTimeout(
        () => this.adapter.getOrder(sanitizedIdentifier),
        'adapter'
      );
      
      Logger.debug('Order retrieved successfully', { 
        orderId: order.orderId,
        status: order.status 
      });
      
      return order;
    });
  }

  /**
   * Get product by identifier
   */
  async getProduct(identifier: ProductIdentifier): Promise<Product> {
    return this.errorHandler.executeOperation('getProduct', async () => {
      if (!identifier.productId && !identifier.sku) {
        throw new ValidationError('identifier', 'Product ID or SKU is required');
      }

      // Sanitize identifiers
      const sanitizedIdentifier: ProductIdentifier = {};
      if (identifier.productId) {
        sanitizedIdentifier.productId = Sanitizer.string(identifier.productId);
      }
      if (identifier.sku) {
        sanitizedIdentifier.sku = Sanitizer.string(identifier.sku);
      }

      Logger.debug('Getting product', { identifier: sanitizedIdentifier });
      
      const product = await TimeoutHandler.withTimeout(
        () => this.adapter.getProduct(sanitizedIdentifier),
        'adapter'
      );
      
      Logger.debug('Product retrieved successfully', { 
        productId: product.productId, 
        sku: product.sku 
      });
      
      return product;
    });
  }

  /**
   * Get customer by identifier
   */
  async getCustomer(identifier: CustomerIdentifier): Promise<Customer> {
    return this.errorHandler.executeOperation('getCustomer', async () => {
      if (!identifier.customerId && !identifier.email) {
        throw new ValidationError('identifier', 'Customer ID or email is required');
      }

      // Sanitize identifiers
      const sanitizedIdentifier: CustomerIdentifier = {};
      if (identifier.customerId) {
        sanitizedIdentifier.customerId = Sanitizer.string(identifier.customerId);
      }
      if (identifier.email) {
        sanitizedIdentifier.email = Sanitizer.string(identifier.email);
      }

      Logger.debug('Getting customer', { identifier: sanitizedIdentifier });
      
      const customer = await TimeoutHandler.withTimeout(
        () => this.adapter.getCustomer(sanitizedIdentifier),
        'adapter'
      );
      
      Logger.debug('Customer retrieved successfully', { 
        customerId: customer.customerId, 
        email: customer.email 
      });
      
      return customer;
    });
  }

  /**
   * Get shipment by identifier
   */
  async getShipment(identifier: ShipmentIdentifier): Promise<Shipment> {
    return this.errorHandler.executeOperation('getShipment', async () => {
      if (!identifier.shipmentId && !identifier.orderId && !identifier.trackingNumber) {
        throw new ValidationError('identifier', 'At least one shipment identifier is required');
      }

      // Sanitize identifiers
      const sanitizedIdentifier: ShipmentIdentifier = {};
      if (identifier.shipmentId) {
        sanitizedIdentifier.shipmentId = Sanitizer.string(identifier.shipmentId);
      }
      if (identifier.orderId) {
        sanitizedIdentifier.orderId = Sanitizer.string(identifier.orderId);
      }
      if (identifier.trackingNumber) {
        sanitizedIdentifier.trackingNumber = Sanitizer.string(identifier.trackingNumber);
      }

      Logger.debug('Getting shipment', { identifier: sanitizedIdentifier });
      
      const shipment = await TimeoutHandler.withTimeout(
        () => this.adapter.getShipment(sanitizedIdentifier),
        'adapter'
      );
      
      Logger.debug('Shipment retrieved successfully', { 
        shipmentId: shipment.shipmentId,
        status: shipment.status,
        trackingNumber: shipment.trackingNumber
      });
      
      return shipment;
    });
  }

  /**
   * Search orders with filters
   */
  async searchOrders(filters: OrderSearchFilters): Promise<{ orders: Order[]; total: number }> {
    return this.errorHandler.executeOperation('searchOrders', async () => {
      // Sanitize filters
      const sanitizedFilters = {
        ...filters,
        status: filters.status ? Sanitizer.string(filters.status) : undefined,
        customerId: filters.customerId ? Sanitizer.string(filters.customerId) : undefined,
        email: filters.email ? Sanitizer.string(filters.email) : undefined,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      Logger.debug('Searching orders', { filters: sanitizedFilters });
      
      const searchFn = this.adapter.searchOrders;
      if (!searchFn) {
        Logger.warn('Adapter does not support searchOrders');
        return { orders: [], total: 0 };
      }
      
      const result = await TimeoutHandler.withTimeout(
        () => searchFn(sanitizedFilters),
        'adapter'
      );
      
      Logger.debug('Order search completed', { 
        found: result.orders.length,
        total: result.total 
      });
      
      return result;
    });
  }

  /**
   * Search products with filters
   */
  async searchProducts(filters: ProductSearchFilters): Promise<{ products: Product[]; total: number }> {
    return this.errorHandler.executeOperation('searchProducts', async () => {
      // Sanitize filters
      const sanitizedFilters = {
        ...filters,
        category: filters.category ? Sanitizer.string(filters.category) : undefined,
        brand: filters.brand ? Sanitizer.string(filters.brand) : undefined,
        status: filters.status ? Sanitizer.string(filters.status) : undefined,
        searchTerm: filters.searchTerm ? Sanitizer.string(filters.searchTerm) : undefined,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      Logger.debug('Searching products', { filters: sanitizedFilters });
      
      const searchProductsFn = this.adapter.searchProducts;
      if (!searchProductsFn) {
        Logger.warn('Adapter does not support searchProducts');
        return { products: [], total: 0 };
      }
      
      const result = await TimeoutHandler.withTimeout(
        () => searchProductsFn(sanitizedFilters),
        'adapter'
      );
      
      Logger.debug('Product search completed', { 
        found: result.products.length,
        total: result.total 
      });
      
      return result;
    });
  }

  /**
   * Get order history for a customer
   */
  async getCustomerOrders(
    customerId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<{ orders: Order[]; total: number }> {
    return this.errorHandler.executeOperation('getCustomerOrders', async () => {
      const sanitizedCustomerId = Sanitizer.string(customerId);
      if (!sanitizedCustomerId) {
        throw new ValidationError('customerId', 'Customer ID is required');
      }

      const sanitizedOptions = {
        limit: options?.limit || 50,
        offset: options?.offset || 0
      };

      Logger.debug('Getting customer orders', { 
        customerId: sanitizedCustomerId,
        ...sanitizedOptions 
      });
      
      const getCustomerOrdersFn = this.adapter.getCustomerOrders;
      if (!getCustomerOrdersFn) {
        Logger.warn('Adapter does not support getCustomerOrders');
        return { orders: [], total: 0 };
      }
      
      const result = await TimeoutHandler.withTimeout(
        () => getCustomerOrdersFn(
          sanitizedCustomerId, 
          sanitizedOptions
        ),
        'adapter'
      );
      
      Logger.debug('Customer orders retrieved', { 
        customerId: sanitizedCustomerId,
        orderCount: result.orders.length,
        total: result.total 
      });
      
      return result;
    });
  }
}
