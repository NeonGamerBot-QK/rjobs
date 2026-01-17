/**
 * Example job that prints a greeting.
 */

import { BaseJob } from '../../../src/index.js';

export default class C extends BaseJob {
  async perform(name = 'world') {
    console.log(`hi ${name}`);
    return { greeted: name };
  }
}
