/**
 * Inline Adapter - executes jobs immediately in the current process.
 * Useful for development, testing, or when background processing isn't needed.
 * Similar to Rails' :inline adapter.
 */

export class InlineAdapter {
  /**
   * Enqueues a job for execution.
   * Since this is the inline adapter, the job executes immediately.
   * 
   * @param {typeof import('../base-job.js').BaseJob} JobClass - The job class to instantiate
   * @param {Object} options - Job execution options
   * @param {any[]} options.args - Arguments to pass to the perform method
   * @param {number} [options.delay] - Delay in milliseconds (simulated with setTimeout)
   * @returns {Promise<any>} The result of the job execution
   */
  async enqueue(JobClass, options = {}) {
    const { args = [], delay = 0 } = options;

    // If delay is specified, wait before executing
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Create a new instance and execute immediately
    const job = new JobClass();
    return job.performNow(...args);
  }

  /**
   * Cleans up resources (no-op for inline adapter).
   */
  async close() {
    // No resources to clean up for inline adapter
  }
}
