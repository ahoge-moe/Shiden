/**
 * @module notification
 * This module handles sending messages to the broker
 */

// Import node modules
const logger = require('logger');
require('toml-require').install({ toml: require('toml') });

// Import custom modules

/**
 * Fetches metadata of the show and sends it to discord webhooks
 * @param {{Object}} job - Current job
 * @param {{string}} outputFileName - Name of outputFile
 * @param {{number}} errorCode - error code from @processJob
 * @return {{void}}
 */
const send = (job, outputFileName, errorCode) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (job.showName) {
      }
      else {
      }
      setTimeout(() => { resolve()}, 10000)
      // resolve();
    }
    catch (e) {
      logger.error(e);
      resolve();
    }
  });
};

module.exports = {
  send,
};
