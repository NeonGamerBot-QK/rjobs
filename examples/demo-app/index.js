/**
 * Demo app showing global job usage.
 * 
 * Run with: node examples/demo-app/index.js
 */

import { loadJobs, config } from '../../src/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Use inline adapter for immediate execution
config.queueAdapter = 'inline';

// Load all jobs from ./jobs folder and register them globally
await loadJobs(join(__dirname, 'jobs'));

console.log('\n--- Using jobs globally ---\n');

// Now C and SendWelcome are available globally!
await C.performNow('zeon');
await C.performNow();

await SendWelcome.performNow('user@example.com');

// Also works with performLater
await C.performLater('from performLater');

console.log('\n--- Done ---');
