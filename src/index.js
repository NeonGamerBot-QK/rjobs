/**
 * ActiveJob for Node.js
 * 
 * A Rails ActiveJob-inspired background job framework.
 * Supports multiple queue adapters (inline, Redis/BullMQ).
 * 
 * @example
 * import { BaseJob, config } from 'active-job-node';
 * 
 * // Configure adapter
 * config.queueAdapter = 'redis';
 * 
 * // Define a job
 * class SendEmailJob extends BaseJob {
 *   async perform(to, subject, body) {
 *     // Send the email...
 *   }
 * }
 * 
 * // Execute now or later
 * await SendEmailJob.performLater('user@example.com', 'Hello', 'World');
 */

// Core exports
export { BaseJob } from './base-job.js';
export { config, ADAPTER_TYPES } from './config.js';

// Adapter exports
export { 
  getAdapter, 
  closeAdapters,
  InlineAdapter,
  RedisAdapter 
} from './adapters/index.js';

// Worker exports (for running the worker process)
export {
  registerJob,
  startWorker,
  startWorkers,
  stopWorkers,
  setupGracefulShutdown
} from './worker.js';
