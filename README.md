# ActiveJob for Node.js

A Rails ActiveJob-inspired background job framework for Node.js. Supports multiple queue adapters including inline execution and Redis-backed queues via BullMQ.

## Features

- **Rails-like API**: `performNow()`, `performLater()`, `performIn()`, `performAt()`
- **Multiple adapters**: Inline (immediate) and Redis (BullMQ/Sidekiq-like)
- **Job lifecycle hooks**: `beforePerform`, `afterPerform`, `onError`
- **Configurable retries**: Per-job retry attempts with backoff
- **Named queues**: Route jobs to specific queues for prioritization
- **Delayed execution**: Schedule jobs for future execution

## Installation

```bash
pnpm install
```

## Quick Start

### 1. Define a Job

```javascript
import { BaseJob } from './src/index.js';

class SendEmailJob extends BaseJob {
  // Optional: specify queue name (default: 'default')
  static queue = 'mailers';
  
  // Optional: configure retries
  static retryAttempts = 5;
  static backoffDelay = 2000;

  async perform(to, subject, body) {
    console.log(`Sending email to ${to}: ${subject}`);
    // Your email logic here
    return { sent: true };
  }

  // Optional lifecycle hooks
  async beforePerform() {
    console.log('About to send email...');
  }

  async afterPerform(result) {
    console.log('Email sent successfully:', result);
  }

  async onError(error) {
    console.error('Failed to send email:', error.message);
  }
}
```

### 2. Execute Jobs

```javascript
import { config } from './src/index.js';

// Use inline adapter (immediate execution - good for development)
config.queueAdapter = 'inline';

// Execute immediately with instance
const job = new SendEmailJob();
await job.performNow('user@example.com', 'Hello', 'World');

// Or use class method
await SendEmailJob.performLater('user@example.com', 'Hello', 'World');

// Delayed execution (waits 5 seconds)
await SendEmailJob.performIn(5000, 'user@example.com', 'Delayed', 'Message');

// Scheduled execution (at specific time)
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
await SendEmailJob.performAt(tomorrow, 'user@example.com', 'Scheduled', 'Message');
```

### 3. Use Redis Adapter for Production

```javascript
import { config, registerJob, startWorker } from './src/index.js';

// Configure Redis adapter
config.queueAdapter = 'redis';
config.redis = { host: 'localhost', port: 6379 };

// Enqueue jobs (they go to Redis)
await SendEmailJob.performLater('user@example.com', 'Hello', 'World');
```

### 4. Run Workers (separate process)

```javascript
import { registerJob, startWorker, setupGracefulShutdown } from './src/index.js';
import { SendEmailJob } from './jobs/send-email-job.js';

// Register all job classes
registerJob(SendEmailJob);

// Start workers for each queue
startWorker('default', { concurrency: 2 });
startWorker('mailers', { concurrency: 1 });

// Handle Ctrl+C gracefully
setupGracefulShutdown();
```

## Configuration

```javascript
import { config } from './src/index.js';

// Set queue adapter: 'inline' or 'redis'
config.queueAdapter = 'redis';

// Configure Redis connection
config.redis = {
  host: 'localhost',
  port: 6379,
  password: 'secret'  // optional
};

// Default retry settings (can be overridden per-job)
config.defaultRetryAttempts = 3;
config.defaultBackoffDelay = 1000;
```

## Runtime Options with `set()`

Override job options for a single enqueue:

```javascript
// Use a different queue for this specific call
await SendEmailJob
  .set({ queue: 'high_priority' })
  .performLater('vip@example.com', 'Urgent', 'Important message');

// Override retry settings
await SendEmailJob
  .set({ attempts: 10, backoff: 5000 })
  .performLater('user@example.com', 'Important', 'Please retry many times');
```

## Running the Examples

```bash
# Install dependencies
pnpm install

# Run inline adapter demo
node examples/usage.js inline

# Run Redis adapter demo (requires Redis)
# Terminal 1: Start Redis
docker run -p 6379:6379 redis:alpine

# Terminal 2: Start workers
node examples/worker-runner.js

# Terminal 3: Enqueue jobs
node examples/usage.js redis
```

## API Reference

### BaseJob

| Method | Description |
|--------|-------------|
| `performNow(...args)` | Executes job immediately with lifecycle hooks |
| `static performLater(...args)` | Enqueues job for async execution |
| `static performIn(delayMs, ...args)` | Enqueues job with delay |
| `static performAt(date, ...args)` | Enqueues job for specific time |
| `static set(options)` | Returns chainable object with overridden options |

### Lifecycle Hooks

| Hook | When Called |
|------|-------------|
| `beforePerform()` | Before `perform()` executes |
| `afterPerform(result)` | After successful `perform()` |
| `onError(error)` | When `perform()` throws an error |

### Worker Functions

| Function | Description |
|----------|-------------|
| `registerJob(JobClass)` | Registers a job class for the worker |
| `startWorker(queueName, options)` | Starts a worker for a queue |
| `startWorkers(queueNames, options)` | Starts workers for multiple queues |
| `stopWorkers()` | Gracefully stops all workers |
| `setupGracefulShutdown()` | Handles SIGTERM/SIGINT for clean shutdown |

## Adapters

### Inline Adapter

Executes jobs immediately in the current process. Useful for:
- Development and testing
- Simple applications without background processing needs
- Debugging job logic

### Redis Adapter

Uses BullMQ for distributed job processing. Features:
- Persistent job storage in Redis
- Horizontal scaling with multiple workers
- Automatic retries with configurable backoff
- Delayed and scheduled jobs
- Job completion and failure tracking

## Comparison with Rails ActiveJob

| Rails ActiveJob | active-job-node |
|-----------------|-----------------|
| `perform_now` | `performNow()` |
| `perform_later` | `performLater()` |
| `set(wait: 5.seconds)` | `performIn(5000, ...)` |
| `set(wait_until: time)` | `performAt(date, ...)` |
| `queue_as :mailers` | `static queue = 'mailers'` |
| `retry_on` | `static retryAttempts = N` |
| `before_perform` | `async beforePerform()` |
| `after_perform` | `async afterPerform(result)` |

## License

MIT
