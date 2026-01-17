/**
 * Another example job.
 */

import { BaseJob } from '../../../src/index.js';

export default class SendWelcome extends BaseJob {
  static queue = 'mailers';

  async perform(email) {
    console.log(`Sending welcome email to ${email}`);
    return { sent: true, to: email };
  }
}
