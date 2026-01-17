/**
 * CommonJS wrapper for rjobs.
 * Dynamically imports the ESM module and re-exports it.
 */

let modulePromise = null;

/**
 * Loads the ESM module and caches it.
 * @returns {Promise<Object>} The rjobs module
 */
function loadModule() {
  if (!modulePromise) {
    modulePromise = import("./index.js");
  }
  return modulePromise;
}

// Re-export everything as async functions that load the module first
module.exports = {
  /**
   * Gets the BaseJob class.
   * @returns {Promise<typeof import('./types').BaseJob>}
   */
  async getBaseJob() {
    const mod = await loadModule();
    return mod.BaseJob;
  },

  /**
   * Gets the config object.
   * @returns {Promise<import('./types').Config>}
   */
  async getConfig() {
    const mod = await loadModule();
    return mod.config;
  },

  /**
   * Loads jobs from a directory.
   * @param {string} jobsDir - Path to jobs directory
   * @param {import('./types').LoadJobsOptions} [options] - Loader options
   * @returns {Promise<Map<string, any>>}
   */
  async loadJobs(jobsDir, options) {
    const mod = await loadModule();
    return mod.loadJobs(jobsDir, options);
  },

  /**
   * Gets a loaded job by name.
   * @param {string} name - Job class name
   * @returns {Promise<any>}
   */
  async getJob(name) {
    const mod = await loadModule();
    return mod.getJob(name);
  },

  /**
   * Gets all loaded jobs.
   * @returns {Promise<Map<string, any>>}
   */
  async getAllJobs() {
    const mod = await loadModule();
    return mod.getAllJobs();
  },

  /**
   * Clears all loaded jobs.
   * @returns {Promise<void>}
   */
  async clearJobs() {
    const mod = await loadModule();
    return mod.clearJobs();
  },

  /**
   * Registers a job with the worker.
   * @param {any} JobClass - The job class
   * @param {string} [filePath] - Optional file path
   * @returns {Promise<void>}
   */
  async registerJob(JobClass, filePath) {
    const mod = await loadModule();
    return mod.registerJob(JobClass, filePath);
  },

  /**
   * Starts a worker for a queue.
   * @param {string} queueName - Queue name
   * @param {import('./types').WorkerOptions} [options] - Worker options
   * @returns {Promise<import('bullmq').Worker>}
   */
  async startWorker(queueName, options) {
    const mod = await loadModule();
    return mod.startWorker(queueName, options);
  },

  /**
   * Starts workers for multiple queues.
   * @param {string[]} queueNames - Queue names
   * @param {import('./types').WorkerOptions} [options] - Worker options
   * @returns {Promise<import('bullmq').Worker[]>}
   */
  async startWorkers(queueNames, options) {
    const mod = await loadModule();
    return mod.startWorkers(queueNames, options);
  },

  /**
   * Stops all workers.
   * @returns {Promise<void>}
   */
  async stopWorkers() {
    const mod = await loadModule();
    return mod.stopWorkers();
  },

  /**
   * Sets up graceful shutdown handlers.
   * @returns {Promise<void>}
   */
  async setupGracefulShutdown() {
    const mod = await loadModule();
    return mod.setupGracefulShutdown();
  },

  /**
   * Gets the current adapter.
   * @returns {Promise<import('./types').Adapter>}
   */
  async getAdapter() {
    const mod = await loadModule();
    return mod.getAdapter();
  },

  /**
   * Closes all adapters.
   * @returns {Promise<void>}
   */
  async closeAdapters() {
    const mod = await loadModule();
    return mod.closeAdapters();
  },

  /**
   * Gets adapter types enum.
   * @returns {Promise<{INLINE: 'inline', REDIS: 'redis'}>}
   */
  async getAdapterTypes() {
    const mod = await loadModule();
    return mod.ADAPTER_TYPES;
  },

  /**
   * Initializes and returns the full module.
   * Use this for full access to all exports.
   * @returns {Promise<typeof import('./index.js')>}
   */
  async init() {
    return loadModule();
  },
};
