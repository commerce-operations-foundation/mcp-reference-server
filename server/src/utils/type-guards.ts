/**
 * Type guard utilities for safe type checking
 */

import { AdapterError } from '../types/adapter.js';
import { FulfillmentError, MCPError } from './errors.js';

/**
 * Check if an unknown error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Check if an unknown error is an AdapterError
 */
export function isAdapterError(error: unknown): error is AdapterError {
  return error instanceof AdapterError;
}

/**
 * Check if an unknown error is a FulfillmentError
 */
export function isFulfillmentError(error: unknown): error is FulfillmentError {
  return error instanceof FulfillmentError;
}

/**
 * Check if an unknown error is an MCPError
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

/**
 * Get error message safely from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
}

/**
 * Get error code safely from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isAdapterError(error) || isMCPError(error)) {
    return error.code;
  }
  if (isFulfillmentError(error)) {
    return String(error.code);
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}