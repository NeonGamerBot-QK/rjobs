/**
 * Job Loader - auto-discovers and registers jobs from a directory.
 * Makes job classes available globally, similar to Rails autoloading.
 */

import { readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { registerJob } from './worker.js';

// Store loaded jobs for reference
const loadedJobs = new Map();

/**
 * Loads all job files from a directory and registers them globally.
 * Job files should export a class that extends BaseJob as default or named export.
 * 
 * @param {string} jobsDir - Absolute path to the jobs directory
 * @param {Object} [options] - Loader options
 * @param {boolean} [options.global=true] - Whether to register jobs on globalThis
 * @param {boolean} [options.registerWorker=true] - Whether to register jobs with the worker
 * @returns {Promise<Map<string, typeof import('./base-job.js').BaseJob>>} Map of job names to classes
 * 
 * @example
 * // In your app's entry point:
 * import { loadJobs } from 'rjobs';
 * await loadJobs(new URL('./jobs', import.meta.url).pathname);
 * 
 * // Now you can use jobs globally:
 * await SendEmailJob.performNow('user@example.com', 'Hi', 'Hello!');
 */
export async function loadJobs(jobsDir, options = {}) {
  const { global: registerGlobal = true, registerWorker = true } = options;

  let files;
  try {
    files = await readdir(jobsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`[rjobs] Jobs directory not found: ${jobsDir}`);
      return loadedJobs;
    }
    throw error;
  }

  // Filter to only .js and .mjs files
  const jobFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.mjs'));

  for (const file of jobFiles) {
    const filePath = join(jobsDir, file);
    const fileUrl = pathToFileURL(filePath).href;

    try {
      // Dynamically import the job file
      const module = await import(fileUrl);

      // Find the job class (default export or first class export)
      const JobClass = module.default || Object.values(module).find(
        exp => typeof exp === 'function' && exp.prototype?.perform
      );

      if (!JobClass) {
        console.warn(`[rjobs] No job class found in ${file}, skipping`);
        continue;
      }

      // Store file path for worker resolution
      JobClass._filePath = filePath;

      // Register with worker if enabled
      if (registerWorker) {
        registerJob(JobClass, filePath);
      }

      // Store in our map
      loadedJobs.set(JobClass.name, JobClass);

      // Register globally if enabled
      if (registerGlobal) {
        globalThis[JobClass.name] = JobClass;
      }

      console.log(`[rjobs] Loaded job: ${JobClass.name} from ${file}`);
    } catch (error) {
      console.error(`[rjobs] Failed to load ${file}:`, error.message);
    }
  }

  return loadedJobs;
}

/**
 * Gets a loaded job class by name.
 * 
 * @param {string} name - The job class name
 * @returns {typeof import('./base-job.js').BaseJob | undefined} The job class
 */
export function getJob(name) {
  return loadedJobs.get(name);
}

/**
 * Gets all loaded job classes.
 * 
 * @returns {Map<string, typeof import('./base-job.js').BaseJob>} Map of all loaded jobs
 */
export function getAllJobs() {
  return new Map(loadedJobs);
}

/**
 * Clears all loaded jobs from memory and global scope.
 */
export function clearJobs() {
  for (const name of loadedJobs.keys()) {
    if (globalThis[name] === loadedJobs.get(name)) {
      delete globalThis[name];
    }
  }
  loadedJobs.clear();
}
