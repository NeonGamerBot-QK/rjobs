/**
 * Worker - processes jobs from Redis queues using BullMQ.
 * Run this as a separate process to handle background jobs.
 * 
 * Usage: node src/worker.js
 * 
 * The worker requires job classes to be registered before it can process them.
 */

import { Worker } from 'bullmq';
import { config } from './config.js';

// Registry of job classes by name
const jobRegistry = new Map();

// Active worker instances
const workers = new Map();

/**
 * Registers a job class with the worker.
 * Must be called for each job type before the worker can process it.
 * 
 * @param {typeof import('./base-job.js').BaseJob} JobClass - The job class to register
 * @param {string} [filePath] - Optional file path for debugging
 * 
 * @example
 * import { registerJob } from './worker.js';
 * import { SendEmailJob } from './jobs/send-email-job.js';
 * registerJob(SendEmailJob);
 */
export function registerJob(JobClass, filePath = null) {
  JobClass._filePath = filePath;
  jobRegistry.set(JobClass.name, JobClass);
  console.log(`[Worker] Registered job: ${JobClass.name}`);
}

/**
 * Processes a single job from the queue.
 * Creates a job instance and calls performNow with the stored arguments.
 * 
 * @param {import('bullmq').Job} bullJob - The BullMQ job to process
 * @returns {Promise<any>} The result of the job execution
 */
async function processJob(bullJob) {
  const { jobClassName, args } = bullJob.data;

  // Look up the job class in the registry
  const JobClass = jobRegistry.get(jobClassName);
  if (!JobClass) {
    throw new Error(
      `Job class "${jobClassName}" not found in registry. ` +
      `Did you forget to call registerJob(${jobClassName})?`
    );
  }

  console.log(`[Worker] Processing ${jobClassName} (ID: ${bullJob.id}, Attempt: ${bullJob.attemptsMade + 1})`);

  // Create instance and set metadata
  const job = new JobClass();
  job.jobId = bullJob.id;
  job.attemptNumber = bullJob.attemptsMade + 1;

  // Execute the job
  const result = await job.performNow(...args);

  console.log(`[Worker] Completed ${jobClassName} (ID: ${bullJob.id})`);
  return result;
}

/**
 * Starts a worker for a specific queue.
 * 
 * @param {string} queueName - The name of the queue to process
 * @param {Object} [options] - Worker options
 * @param {number} [options.concurrency=1] - Number of concurrent jobs to process
 * @returns {Worker} The BullMQ Worker instance
 */
export function startWorker(queueName, options = {}) {
  const { concurrency = 1 } = options;

  if (workers.has(queueName)) {
    console.log(`[Worker] Worker for queue "${queueName}" already running`);
    return workers.get(queueName);
  }

  const worker = new Worker(queueName, processJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    },
    concurrency
  });

  // Event handlers for logging and debugging
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
    if (job && job.attemptsMade < job.opts.attempts) {
      console.log(`[Worker] Job ${job.id} will be retried (${job.attemptsMade}/${job.opts.attempts} attempts)`);
    }
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  workers.set(queueName, worker);
  console.log(`[Worker] Started worker for queue "${queueName}" (concurrency: ${concurrency})`);

  return worker;
}

/**
 * Starts workers for multiple queues.
 * 
 * @param {string[]} queueNames - Array of queue names to process
 * @param {Object} [options] - Worker options passed to each worker
 * @returns {Worker[]} Array of BullMQ Worker instances
 */
export function startWorkers(queueNames, options = {}) {
  return queueNames.map(name => startWorker(name, options));
}

/**
 * Stops all running workers gracefully.
 * Waits for current jobs to complete before shutting down.
 */
export async function stopWorkers() {
  console.log('[Worker] Stopping all workers...');
  const closePromises = [];
  
  for (const [queueName, worker] of workers.entries()) {
    console.log(`[Worker] Closing worker for queue "${queueName}"`);
    closePromises.push(worker.close());
  }
  
  await Promise.all(closePromises);
  workers.clear();
  console.log('[Worker] All workers stopped');
}

/**
 * Graceful shutdown handler.
 * Ensures workers are stopped properly on process termination.
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);
    await stopWorkers();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Main execution when run directly
// This is just a template - customize for your application
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('[Worker] Starting in standalone mode...');
  console.log('[Worker] No jobs registered. Import and register your job classes.');
  console.log('[Worker] Example:');
  console.log('');
  console.log('  import { registerJob, startWorker } from "./src/worker.js";');
  console.log('  import { SendEmailJob } from "./examples/send-email-job.js";');
  console.log('');
  console.log('  registerJob(SendEmailJob);');
  console.log('  startWorker("default");');
  console.log('');
  
  setupGracefulShutdown();
}

export { setupGracefulShutdown };
