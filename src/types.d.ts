/**
 * Type definitions for rjobs
 * A Rails ActiveJob-inspired background job framework for Node.js
 */

import { Job, Worker, Queue } from 'bullmq';

// ============================================================================
// Configuration
// ============================================================================

export type AdapterType = 'inline' | 'redis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface Config {
  /** Queue adapter type: 'inline' or 'redis' */
  queueAdapter: AdapterType;
  /** Redis connection options */
  redis: RedisConfig;
  /** Default number of retry attempts for failed jobs */
  defaultRetryAttempts: number;
  /** Default backoff delay in milliseconds between retries */
  defaultBackoffDelay: number;
  /** Resets configuration to default values */
  reset(): void;
}

export const config: Config;

export const ADAPTER_TYPES: {
  INLINE: 'inline';
  REDIS: 'redis';
};

// ============================================================================
// Base Job
// ============================================================================

export interface JobInstance {
  /** Arguments passed to this job instance */
  arguments: unknown[];
  /** Number of times this job has been attempted */
  attemptNumber: number;
  /** The BullMQ job ID (only set when processed by worker) */
  jobId: string | null;

  /**
   * Executes the job immediately with lifecycle hooks.
   * @param args - Arguments to pass to the perform method
   * @returns The result of the perform method
   */
  performNow<T = unknown>(...args: unknown[]): Promise<T>;

  /**
   * Main job logic - must be implemented by subclasses.
   * @param args - Arguments passed to performNow/performLater
   * @returns The job result
   */
  perform<T = unknown>(...args: unknown[]): Promise<T>;

  /**
   * Optional lifecycle hook - called before perform().
   */
  beforePerform?(): Promise<void>;

  /**
   * Optional lifecycle hook - called after successful perform().
   * @param result - The return value from perform()
   */
  afterPerform?<T = unknown>(result: T): Promise<void>;

  /**
   * Optional error handler - called when perform() throws an error.
   * @param error - The error that was thrown
   */
  onError?(error: Error): Promise<void>;
}

export interface SetOptions {
  /** Override queue name for this call */
  queue?: string;
  /** Override retry attempts */
  attempts?: number;
  /** Override backoff delay in milliseconds */
  backoff?: number;
}

export interface ChainableJob {
  performLater<T = unknown>(...args: unknown[]): Promise<T>;
  performIn<T = unknown>(delayMs: number, ...args: unknown[]): Promise<T>;
  performAt<T = unknown>(date: Date, ...args: unknown[]): Promise<T>;
}

export interface BaseJobStatic {
  /** Queue name for this job type */
  queue: string;
  /** Number of retry attempts for this job */
  retryAttempts: number | null;
  /** Backoff delay in milliseconds between retries */
  backoffDelay: number | null;
  /** File path where this job class is defined */
  _filePath: string | null;

  new (): JobInstance;

  /**
   * Executes the job immediately.
   * @param args - Arguments to pass to the perform method
   * @returns The result of the perform method
   */
  performNow<T = unknown>(...args: unknown[]): Promise<T>;

  /**
   * Enqueues the job for later execution.
   * @param args - Arguments to pass to the perform method
   * @returns Adapter-specific result
   */
  performLater<T = unknown>(...args: unknown[]): Promise<T>;

  /**
   * Schedules the job to execute after a delay.
   * @param delayMs - Delay in milliseconds before execution
   * @param args - Arguments to pass to the perform method
   * @returns Adapter-specific result
   */
  performIn<T = unknown>(delayMs: number, ...args: unknown[]): Promise<T>;

  /**
   * Schedules the job to execute at a specific time.
   * @param date - The date/time when the job should execute
   * @param args - Arguments to pass to the perform method
   * @returns Adapter-specific result
   */
  performAt<T = unknown>(date: Date, ...args: unknown[]): Promise<T>;

  /**
   * Sets configuration options for this specific enqueue call.
   * @param options - Configuration options
   * @returns Chainable object with performLater method
   */
  set(options: SetOptions): ChainableJob;
}

export const BaseJob: BaseJobStatic;

// ============================================================================
// Adapters
// ============================================================================

export interface EnqueueOptions {
  args?: unknown[];
  delay?: number;
  attempts?: number;
  backoff?: number;
}

export interface Adapter {
  enqueue<T = unknown>(JobClass: BaseJobStatic, options?: EnqueueOptions): Promise<T>;
  close(): Promise<void>;
}

export class InlineAdapter implements Adapter {
  enqueue<T = unknown>(JobClass: BaseJobStatic, options?: EnqueueOptions): Promise<T>;
  close(): Promise<void>;
}

export class RedisAdapter implements Adapter {
  enqueue(JobClass: BaseJobStatic, options?: EnqueueOptions): Promise<Job>;
  close(): Promise<void>;
}

/**
 * Gets the current adapter instance based on configuration.
 */
export function getAdapter(): Adapter;

/**
 * Closes all adapter connections.
 */
export function closeAdapters(): Promise<void>;

// ============================================================================
// Worker
// ============================================================================

export interface WorkerOptions {
  /** Number of concurrent jobs to process */
  concurrency?: number;
}

/**
 * Registers a job class with the worker.
 * @param JobClass - The job class to register
 * @param filePath - Optional file path for debugging
 */
export function registerJob(JobClass: BaseJobStatic, filePath?: string): void;

/**
 * Starts a worker for a specific queue.
 * @param queueName - The name of the queue to process
 * @param options - Worker options
 * @returns The BullMQ Worker instance
 */
export function startWorker(queueName: string, options?: WorkerOptions): Worker;

/**
 * Starts workers for multiple queues.
 * @param queueNames - Array of queue names to process
 * @param options - Worker options passed to each worker
 * @returns Array of BullMQ Worker instances
 */
export function startWorkers(queueNames: string[], options?: WorkerOptions): Worker[];

/**
 * Stops all running workers gracefully.
 */
export function stopWorkers(): Promise<void>;

/**
 * Sets up graceful shutdown handlers for SIGTERM/SIGINT.
 */
export function setupGracefulShutdown(): void;

// ============================================================================
// Loader
// ============================================================================

export interface LoadJobsOptions {
  /** Whether to register jobs on globalThis (default: true) */
  global?: boolean;
  /** Whether to register jobs with the worker (default: true) */
  registerWorker?: boolean;
}

/**
 * Loads all job files from a directory and registers them globally.
 * @param jobsDir - Absolute path to the jobs directory
 * @param options - Loader options
 * @returns Map of job names to classes
 */
export function loadJobs(
  jobsDir: string,
  options?: LoadJobsOptions
): Promise<Map<string, BaseJobStatic>>;

/**
 * Gets a loaded job class by name.
 * @param name - The job class name
 * @returns The job class or undefined
 */
export function getJob(name: string): BaseJobStatic | undefined;

/**
 * Gets all loaded job classes.
 * @returns Map of all loaded jobs
 */
export function getAllJobs(): Map<string, BaseJobStatic>;

/**
 * Clears all loaded jobs from memory and global scope.
 */
export function clearJobs(): void;
