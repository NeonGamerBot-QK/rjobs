/**
 * Global configuration for ActiveJob.
 * Manages adapter selection and Redis connection settings.
 */

// Available adapter types that can be configured
export const ADAPTER_TYPES = {
  INLINE: 'inline',
  REDIS: 'redis'
};

// Default configuration values
const defaultConfig = {
  queueAdapter: ADAPTER_TYPES.INLINE,
  redis: {
    host: 'localhost',
    port: 6379
  },
  defaultRetryAttempts: 3,
  defaultBackoffDelay: 1000
};

// Current configuration state (mutable singleton)
let currentConfig = { ...defaultConfig };

/**
 * ActiveJob configuration object.
 * Use this to set global options like queue adapter and Redis connection.
 * 
 * @example
 * // Switch to Redis adapter
 * config.queueAdapter = 'redis';
 * 
 * // Configure Redis connection
 * config.redis = { host: 'redis.example.com', port: 6380 };
 */
export const config = {
  /**
   * Gets or sets the queue adapter type.
   * @type {'inline' | 'redis'}
   */
  get queueAdapter() {
    return currentConfig.queueAdapter;
  },
  set queueAdapter(adapter) {
    if (!Object.values(ADAPTER_TYPES).includes(adapter)) {
      throw new Error(`Unknown adapter: ${adapter}. Valid options: ${Object.values(ADAPTER_TYPES).join(', ')}`);
    }
    currentConfig.queueAdapter = adapter;
  },

  /**
   * Gets or sets Redis connection options.
   * @type {{ host: string, port: number, password?: string }}
   */
  get redis() {
    return currentConfig.redis;
  },
  set redis(options) {
    currentConfig.redis = { ...currentConfig.redis, ...options };
  },

  /**
   * Gets or sets the default number of retry attempts for failed jobs.
   * @type {number}
   */
  get defaultRetryAttempts() {
    return currentConfig.defaultRetryAttempts;
  },
  set defaultRetryAttempts(attempts) {
    currentConfig.defaultRetryAttempts = attempts;
  },

  /**
   * Gets or sets the default backoff delay in milliseconds between retries.
   * @type {number}
   */
  get defaultBackoffDelay() {
    return currentConfig.defaultBackoffDelay;
  },
  set defaultBackoffDelay(delay) {
    currentConfig.defaultBackoffDelay = delay;
  },

  /**
   * Resets configuration to default values.
   * Useful for testing or resetting state.
   */
  reset() {
    currentConfig = { ...defaultConfig };
  }
};
