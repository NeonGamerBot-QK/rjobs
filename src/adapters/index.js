/**
 * Adapter factory module.
 * Provides the current adapter instance based on global configuration.
 */

import { config, ADAPTER_TYPES } from '../config.js';
import { InlineAdapter } from './inline-adapter.js';
import { RedisAdapter } from './redis-adapter.js';

// Cached adapter instances
let inlineAdapter = null;
let redisAdapter = null;

/**
 * Gets the current adapter instance based on configuration.
 * Adapters are lazily instantiated and cached.
 * 
 * @returns {InlineAdapter | RedisAdapter} The configured adapter instance
 */
export function getAdapter() {
  switch (config.queueAdapter) {
    case ADAPTER_TYPES.INLINE:
      if (!inlineAdapter) {
        inlineAdapter = new InlineAdapter();
      }
      return inlineAdapter;

    case ADAPTER_TYPES.REDIS:
      if (!redisAdapter) {
        redisAdapter = new RedisAdapter();
      }
      return redisAdapter;

    default:
      throw new Error(`Unknown adapter type: ${config.queueAdapter}`);
  }
}

/**
 * Closes all adapter connections.
 * Should be called during application shutdown.
 */
export async function closeAdapters() {
  const promises = [];
  if (inlineAdapter) {
    promises.push(inlineAdapter.close());
    inlineAdapter = null;
  }
  if (redisAdapter) {
    promises.push(redisAdapter.close());
    redisAdapter = null;
  }
  await Promise.all(promises);
}

export { InlineAdapter } from './inline-adapter.js';
export { RedisAdapter } from './redis-adapter.js';
