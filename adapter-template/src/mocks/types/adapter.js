"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidOrderStateError = exports.InsufficientInventoryError = exports.CustomerNotFoundError = exports.ProductNotFoundError = exports.OrderNotFoundError = exports.AdapterError = void 0;
class AdapterError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AdapterError';
    }
}
exports.AdapterError = AdapterError;
class OrderNotFoundError extends AdapterError {
    constructor(identifier) {
        super(`Order not found: ${JSON.stringify(identifier)}`, 'ORDER_NOT_FOUND', identifier);
    }
}
exports.OrderNotFoundError = OrderNotFoundError;
class ProductNotFoundError extends AdapterError {
    constructor(identifier) {
        super(`Product not found: ${JSON.stringify(identifier)}`, 'PRODUCT_NOT_FOUND', identifier);
    }
}
exports.ProductNotFoundError = ProductNotFoundError;
class CustomerNotFoundError extends AdapterError {
    constructor(identifier) {
        super(`Customer not found: ${JSON.stringify(identifier)}`, 'CUSTOMER_NOT_FOUND', identifier);
    }
}
exports.CustomerNotFoundError = CustomerNotFoundError;
class InsufficientInventoryError extends AdapterError {
    constructor(sku, requested, available) {
        super(`Insufficient inventory for SKU ${sku}: requested ${requested}, available ${available}`, 'INSUFFICIENT_INVENTORY', { sku, requested, available });
    }
}
exports.InsufficientInventoryError = InsufficientInventoryError;
class InvalidOrderStateError extends AdapterError {
    constructor(orderId, currentStatus, operation) {
        super(`Cannot ${operation} order ${orderId} in status ${currentStatus}`, 'INVALID_ORDER_STATE', { orderId, currentStatus, operation });
    }
}
exports.InvalidOrderStateError = InvalidOrderStateError;
//# sourceMappingURL=adapter.js.map