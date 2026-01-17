/**
 * Redis Adapter - uses BullMQ for distributed job processing.
 * Jobs are pushed to a Redis-backed queue and processed by separate workers.
 * Similar to Rails' Sidekiq adapter.
 */

import { Queue } from 'bullmq';
import { config } from '../config.js';

// Cache of queue instances keyed by queue name
const queues = new Map();

/**
 * Gets or creates a BullMQ Queue instance for the given queue name.
 * Queues are cached to avoid creating multiple connections.
 * 
 * @param {string} queueName - The name of the queue
 * @returns {Queue} The BullMQ Queue instance
 */
function getQueue(queueName) {
  if (!queues.has(queueName)) {
    const queue = new Queue(queueName, {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
      }
    });
    queues.set(queueName, queue);
  }
  return queues.get(queueName);
}

export class RedisAdapter {
  /**
   * Enqueues a job to the Redis-backed queue for later processing.
   * 
   * @param {typeof import('../base-job.js').BaseJob} JobClass - The job class
   * @param {Object} options - Job execution options
   * @param {any[]} options.args - Arguments to pass to the perform method
   * @param {number} [options.delay] - Delay in milliseconds before processing
   * @param {number} [options.attempts] - Number of retry attempts on failure
   * @param {number} [options.backoff] - Backoff delay between retries in ms
   * @returns {Promise<import('bullmq').Job>} The BullMQ job instance
   */
  async enqueue(JobClass, options = {}) {
    const {
      args = [],
      delay = 0,
      attempts = config.defaultRetryAttempts,
      backoff = config.defaultBackoffDelay
    } = options;

    // Determine which queue to use (job-specific or default)
    const queueName = JobClass.queue || 'default';
    const queue = getQueue(queueName);

    // Serialize job data for Redis storage
    const jobData = {
      jobClassName: JobClass.name,
      jobClassPath: JobClass._filePath || null,
      args
    };

    // Add job to the queue with BullMQ options
    const job = await queue.add(JobClass.name, jobData, {
      delay,
      attempts,
      backoff: {
        type: 'fixed',
        delay: backoff
      },
      removeOnComplete: true,
      removeOnFail: false
    });

    console.log(`[ActiveJob] Enqueued ${JobClass.name} to queue "${queueName}" with ID: ${job.id}`);
    return job;
  }

  /**
   * Closes all queue connections.
   * Should be called when shutting down the application.
   */
  async close() {
    const closePromises = [];
    for (const queue of queues.values()) {
      closePromises.push(queue.close());
    }
    await Promise.all(closePromises);
    queues.clear();
  }
}
