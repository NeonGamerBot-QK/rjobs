/**
 * BaseJob - abstract base class for all jobs.
 * Provides the core API similar to Rails ActiveJob::Base.
 * 
 * Subclasses must implement the `perform()` method.
 */

import { getAdapter } from './adapters/index.js';
import { config } from './config.js';

export class BaseJob {
  /**
   * Queue name for this job type.
   * Override in subclasses to use a different queue.
   * @type {string}
   */
  static queue = 'default';

  /**
   * Number of retry attempts for this job.
   * Override in subclasses for job-specific retry behavior.
   * @type {number | null}
   */
  static retryAttempts = null;

  /**
   * Backoff delay in milliseconds between retries.
   * Override in subclasses for job-specific backoff.
   * @type {number | null}
   */
  static backoffDelay = null;

  /**
   * File path where this job class is defined.
   * Set automatically when registering jobs for the worker.
   * @type {string | null}
   */
  static _filePath = null;

  /**
   * The arguments passed to this job instance.
   * @type {any[]}
   */
  arguments = [];

  /**
   * Number of times this job has been attempted.
   * Set by the worker during processing.
   * @type {number}
   */
  attemptNumber = 1;

  /**
   * The BullMQ job ID (only set when processed by worker).
   * @type {string | null}
   */
  jobId = null;

  /**
   * Executes the job immediately in the current process.
   * Runs lifecycle hooks (beforePerform, afterPerform) around execution.
   * 
   * @param {...any} args - Arguments to pass to the perform method
   * @returns {Promise<any>} The result of the perform method
   */
  async performNow(...args) {
    this.arguments = args;

    try {
      // Run before hook if defined
      if (typeof this.beforePerform === 'function') {
        await this.beforePerform();
      }

      // Execute the main job logic
      const result = await this.perform(...args);

      // Run after hook if defined
      if (typeof this.afterPerform === 'function') {
        await this.afterPerform(result);
      }

      return result;
    } catch (error) {
      // Run error handler if defined
      if (typeof this.onError === 'function') {
        await this.onError(error);
      }
      throw error;
    }
  }

  /**
   * Enqueues the job for later execution using the configured adapter.
   * 
   * @param {...any} args - Arguments to pass to the perform method
   * @returns {Promise<any>} Adapter-specific result (job ID for Redis, result for inline)
   */
  static async performLater(...args) {
    const adapter = getAdapter();
    return adapter.enqueue(this, {
      args,
      attempts: this.retryAttempts ?? config.defaultRetryAttempts,
      backoff: this.backoffDelay ?? config.defaultBackoffDelay
    });
  }

  /**
   * Schedules the job to execute after a delay.
   * 
   * @param {number} delayMs - Delay in milliseconds before execution
   * @param {...any} args - Arguments to pass to the perform method
   * @returns {Promise<any>} Adapter-specific result
   */
  static async performIn(delayMs, ...args) {
    const adapter = getAdapter();
    return adapter.enqueue(this, {
      args,
      delay: delayMs,
      attempts: this.retryAttempts ?? config.defaultRetryAttempts,
      backoff: this.backoffDelay ?? config.defaultBackoffDelay
    });
  }

  /**
   * Schedules the job to execute at a specific time.
   * 
   * @param {Date} date - The date/time when the job should execute
   * @param {...any} args - Arguments to pass to the perform method
   * @returns {Promise<any>} Adapter-specific result
   */
  static async performAt(date, ...args) {
    const delayMs = Math.max(0, date.getTime() - Date.now());
    return this.performIn(delayMs, ...args);
  }

  /**
   * Sets configuration options for this specific enqueue call.
   * Returns a chainable object for fluent API.
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.queue] - Override queue name for this call
   * @param {number} [options.attempts] - Override retry attempts
   * @param {number} [options.backoff] - Override backoff delay
   * @returns {Object} Chainable object with performLater method
   * 
   * @example
   * await SendEmailJob.set({ queue: 'high_priority' }).performLater(email);
   */
  static set(options) {
    const JobClass = this;
    
    // Create a temporary subclass with overridden options
    const ConfiguredJob = class extends JobClass {
      static queue = options.queue ?? JobClass.queue;
      static retryAttempts = options.attempts ?? JobClass.retryAttempts;
      static backoffDelay = options.backoff ?? JobClass.backoffDelay;
    };
    
    // Copy the class name for proper identification
    Object.defineProperty(ConfiguredJob, 'name', { value: JobClass.name });
    ConfiguredJob._filePath = JobClass._filePath;

    return {
      async performLater(...args) {
        return ConfiguredJob.performLater(...args);
      },
      async performIn(delayMs, ...args) {
        return ConfiguredJob.performIn(delayMs, ...args);
      },
      async performAt(date, ...args) {
        return ConfiguredJob.performAt(date, ...args);
      }
    };
  }

  /**
   * Abstract method - must be implemented by subclasses.
   * Contains the actual job logic to execute.
   * 
   * @param {...any} args - Arguments passed to performNow/performLater
   * @returns {Promise<any>} The job result
   * @throws {Error} If not implemented by subclass
   */
  async perform(...args) {
    throw new Error(
      `${this.constructor.name} must implement the perform() method`
    );
  }

  /**
   * Optional lifecycle hook - called before perform().
   * Override in subclasses to add pre-execution logic.
   */
  // async beforePerform() {}

  /**
   * Optional lifecycle hook - called after successful perform().
   * Override in subclasses to add post-execution logic.
   * 
   * @param {any} result - The result returned by perform()
   */
  // async afterPerform(result) {}

  /**
   * Optional error handler - called when perform() throws an error.
   * Override in subclasses to add custom error handling.
   * 
   * @param {Error} error - The error that was thrown
   */
  // async onError(error) {}
}
