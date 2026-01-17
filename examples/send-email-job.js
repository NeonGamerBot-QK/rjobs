/**
 * Example job: SendEmailJob
 * Demonstrates how to create a job with lifecycle hooks and error handling.
 */

import { BaseJob } from '../src/index.js';

export class SendEmailJob extends BaseJob {
  // Use the 'mailers' queue instead of default
  static queue = 'mailers';

  // Retry up to 5 times on failure
  static retryAttempts = 5;

  // Wait 2 seconds between retries
  static backoffDelay = 2000;

  /**
   * Called before the job performs.
   * Use for setup, logging, or validation.
   */
  async beforePerform() {
    console.log(`[SendEmailJob] Starting email job (Attempt ${this.attemptNumber})`);
    console.log(`[SendEmailJob] Arguments: ${JSON.stringify(this.arguments)}`);
  }

  /**
   * Main job logic - sends an email.
   * 
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject line
   * @param {string} body - Email body content
   * @returns {Object} Email delivery result
   */
  async perform(to, subject, body) {
    console.log(`[SendEmailJob] Sending email...`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${body}`);

    // Simulate email sending (replace with actual email service)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Uncomment to simulate occasional failures for testing retries:
    // if (Math.random() < 0.1) {
    //   throw new Error('Simulated email delivery failure');
    // }

    return {
      delivered: true,
      to,
      subject,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Called after successful job completion.
   * Use for cleanup, notifications, or logging.
   * 
   * @param {Object} result - The return value from perform()
   */
  async afterPerform(result) {
    console.log(`[SendEmailJob] Email sent successfully!`);
    console.log(`[SendEmailJob] Result: ${JSON.stringify(result)}`);
  }

  /**
   * Called when the job fails with an error.
   * Use for error reporting, alerting, or cleanup.
   * 
   * @param {Error} error - The error that was thrown
   */
  async onError(error) {
    console.error(`[SendEmailJob] Failed to send email: ${error.message}`);
    // In production, you might want to:
    // - Log to an error tracking service (Sentry, etc.)
    // - Send an alert to the operations team
    // - Record the failure in a database
  }
}
