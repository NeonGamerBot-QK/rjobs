/**
 * Example usage demonstrating the ActiveJob-like framework.
 * Shows both inline and Redis adapter modes.
 * 
 * Run with: node examples/usage.js
 */

import { 
  BaseJob, 
  config, 
  closeAdapters,
  registerJob,
  startWorker,
  stopWorkers,
  setupGracefulShutdown
} from '../src/index.js';
import { SendEmailJob } from './send-email-job.js';

// ============================================================================
// Additional Example Jobs
// ============================================================================

/**
 * Simple job that processes data without custom hooks.
 */
class ProcessDataJob extends BaseJob {
  static queue = 'default';

  async perform(data) {
    console.log(`[ProcessDataJob] Processing data: ${JSON.stringify(data)}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return { processed: true, data };
  }
}

/**
 * Job that intentionally fails (for testing retries).
 */
class FailingJob extends BaseJob {
  static queue = 'default';
  static retryAttempts = 3;
  static backoffDelay = 500;

  async perform(message) {
    console.log(`[FailingJob] Attempt ${this.attemptNumber}: ${message}`);
    throw new Error('This job always fails!');
  }

  async onError(error) {
    console.log(`[FailingJob] Error handled: ${error.message}`);
  }
}

// ============================================================================
// Demo Functions
// ============================================================================

/**
 * Demonstrates inline adapter usage.
 * Jobs execute immediately in the current process.
 */
async function demoInlineAdapter() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO: Inline Adapter (immediate execution)');
  console.log('='.repeat(60) + '\n');

  // Ensure inline adapter is configured
  config.queueAdapter = 'inline';
  console.log(`Adapter: ${config.queueAdapter}\n`);

  // Method 1: performNow - executes immediately with instance
  console.log('--- performNow (instance method) ---');
  const job = new SendEmailJob();
  const result1 = await job.performNow(
    'user@example.com',
    'Welcome!',
    'Thanks for signing up.'
  );
  console.log('Result:', result1, '\n');

  // Method 2: performLater with inline adapter - also immediate
  console.log('--- performLater (with inline adapter) ---');
  const result2 = await SendEmailJob.performLater(
    'admin@example.com',
    'Daily Report',
    'Here is your daily report...'
  );
  console.log('Result:', result2, '\n');

  // Method 3: performIn - delayed execution (simulated with setTimeout)
  console.log('--- performIn (500ms delay with inline adapter) ---');
  const start = Date.now();
  await ProcessDataJob.performIn(500, { items: [1, 2, 3] });
  console.log(`Executed after ${Date.now() - start}ms\n`);

  // Method 4: set() for runtime configuration
  console.log('--- set() for runtime options ---');
  await SendEmailJob
    .set({ queue: 'high_priority', attempts: 10 })
    .performLater('vip@example.com', 'Urgent!', 'This is urgent.');
  console.log('');
}

/**
 * Demonstrates Redis adapter usage.
 * Jobs are enqueued to Redis and processed by a worker.
 */
async function demoRedisAdapter() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO: Redis Adapter (BullMQ)');
  console.log('='.repeat(60) + '\n');

  // Configure Redis adapter
  config.queueAdapter = 'redis';
  config.redis = { host: 'localhost', port: 6379 };
  console.log(`Adapter: ${config.queueAdapter}`);
  console.log(`Redis: ${config.redis.host}:${config.redis.port}\n`);

  // Register jobs with the worker
  registerJob(SendEmailJob);
  registerJob(ProcessDataJob);
  registerJob(FailingJob);

  // Start workers for our queues
  console.log('Starting workers...\n');
  startWorker('default', { concurrency: 2 });
  startWorker('mailers', { concurrency: 1 });

  // Allow workers to connect
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Enqueue jobs
  console.log('--- Enqueueing jobs ---\n');

  await SendEmailJob.performLater(
    'user@example.com',
    'Redis Test',
    'This job was processed via Redis!'
  );

  await ProcessDataJob.performLater({ source: 'api', count: 100 });

  // Enqueue a delayed job (5 seconds)
  await ProcessDataJob.performIn(5000, { delayed: true });
  console.log('Enqueued delayed job (5 second delay)\n');

  // Enqueue a job scheduled for a specific time
  const futureTime = new Date(Date.now() + 3000);
  await SendEmailJob.performAt(futureTime, 'future@example.com', 'Scheduled', 'This was scheduled!');
  console.log(`Enqueued scheduled job for ${futureTime.toISOString()}\n`);

  // Wait for jobs to process
  console.log('Waiting for jobs to complete...\n');
  await new Promise(resolve => setTimeout(resolve, 8000));
}

/**
 * Main function - runs the demos.
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'inline';

  try {
    if (mode === 'inline' || mode === 'all') {
      await demoInlineAdapter();
    }

    if (mode === 'redis' || mode === 'all') {
      // Check if Redis is available
      console.log('\nAttempting Redis demo (requires Redis server)...');
      try {
        await demoRedisAdapter();
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('\nRedis is not available. Start Redis to run this demo:');
          console.log('  docker run -p 6379:6379 redis:alpine');
          console.log('  OR');
          console.log('  redis-server');
        } else {
          throw error;
        }
      }
    }

    if (!['inline', 'redis', 'all'].includes(mode)) {
      console.log('Usage: node examples/usage.js [inline|redis|all]');
      console.log('  inline - Demo inline adapter (default)');
      console.log('  redis  - Demo Redis adapter (requires Redis)');
      console.log('  all    - Run both demos');
    }

  } finally {
    // Cleanup
    await stopWorkers();
    await closeAdapters();
    console.log('\n✓ Cleanup complete');
  }
}

// Run main and handle errors
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
