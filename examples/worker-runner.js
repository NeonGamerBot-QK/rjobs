/**
 * Worker Runner - starts workers for processing Redis jobs.
 * 
 * Run this in a separate terminal to process background jobs:
 *   node examples/worker-runner.js
 * 
 * Then enqueue jobs from another process using:
 *   node examples/usage.js redis
 */

import { 
  config,
  registerJob, 
  startWorker, 
  setupGracefulShutdown 
} from '../src/index.js';
import { SendEmailJob } from './send-email-job.js';

// Define additional jobs inline or import them
class ProcessDataJob extends (await import('../src/base-job.js')).BaseJob {
  static queue = 'default';

  async perform(data) {
    console.log(`[ProcessDataJob] Processing: ${JSON.stringify(data)}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { processed: true };
  }
}

// Configure Redis connection
config.redis = { 
  host: process.env.REDIS_HOST || 'localhost', 
  port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║             ActiveJob Worker Runner                        ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\nRedis: ${config.redis.host}:${config.redis.port}`);
console.log('');

// Register all job classes
registerJob(SendEmailJob);
registerJob(ProcessDataJob);

// Start workers for each queue
startWorker('default', { concurrency: 2 });
startWorker('mailers', { concurrency: 1 });

console.log('\nWorkers are running. Press Ctrl+C to stop.\n');

// Handle graceful shutdown
setupGracefulShutdown();
