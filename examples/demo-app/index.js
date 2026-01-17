/**
 * Demo app showing global job usage with Redis.
 * 
 * Start Redis first:
 *   docker compose up -d
 * 
 * Then run the app:
 *   node examples/demo-app/index.js
 */

import { loadJobs, config, startWorker, stopWorkers, closeAdapters } from '../../src/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure Redis adapter
config.queueAdapter = 'redis';
config.redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

console.log(`Using Redis at ${config.redis.host}:${config.redis.port}\n`);

// Load all jobs from ./jobs folder and register them globally
await loadJobs(join(__dirname, 'jobs'));

// Start workers to process jobs
startWorker('default', { concurrency: 2 });
startWorker('mailers', { concurrency: 1 });

// Wait for workers to connect
await new Promise(resolve => setTimeout(resolve, 500));

console.log('\n--- Enqueueing jobs ---\n');

// Jobs are available globally - no imports needed!
await C.performNow('zeon');
await C.performLater('from performLater');

await SendWelcome.performLater('user@example.com');

// Delayed job (2 seconds)
await C.performIn(2000, 'delayed by 2s');

console.log('\n--- Waiting for jobs to process ---\n');

// Wait for jobs to be processed
await new Promise(resolve => setTimeout(resolve, 4000));

// Cleanup
await stopWorkers();
await closeAdapters();

console.log('\n--- Done ---');
