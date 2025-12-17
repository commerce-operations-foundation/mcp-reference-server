/**
 * Main entry point for Rydership adapter
 * 
 * The adapter factory expects a default export of the adapter class.
 * Additional exports are optional for direct usage.
 */

// Default export for the adapter factory to load
import { RydershipAdapter } from './adapter.js';
export default RydershipAdapter;

// Named export for direct usage (optional)
export { RydershipAdapter } from './adapter.js';
