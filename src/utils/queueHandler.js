/**
 * @module queueHandler
 * This module handles everything related to the queue
 */

// Import node modules
const fs = require('fs');
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

module.exports = queueHandler = {
  /**
   * Remove the queue file itself
   * @return {{void}}
   */
  wipe: () => {
    logger.debug(`Wiping queue`);
    if (queueHandler.fileExists()) {
      fs.unlinkSync(pathHandler.queueFile);
      logger.success('Wiped queue');
    }
    else {
      logger.info(`Queue file does not exist. Don't have to wipe it.`);
    }
    return;
  },

  /**
   * Checks if queue file exists or not
   * @return {{boolean}}
   */
  fileExists: () => {
    if (fs.existsSync(pathHandler.queueFile)) return true;
    else return false;
  },

  /**
  * Check if queue is empty or not and returns a boolean
  * @return {{boolean}}
  */
  isEmpty: () => {
    if (queueHandler.fileExists()) {
      const data = fs.readFileSync(pathHandler.queueFile, { encoding: 'utf8' });
      const queue = JSON.parse(data);
      if (queue.length) {
        logger.debug(`Queue still has jobs`);
        return false;
      }
      else {
        logger.debug(`Queue is empty`);
        return true;
      }
    }
    else {
      logger.debug('Queue file does not exist');
      return true;
    }
  },

  /**
   * Append incoming payload to the queue
   * @param {{Object}} payload - Incoming payload in JSON format
   * @return {{void}}
   */
  push: payload => {
    if (queueHandler.fileExists()) {
      // Read then write
      const data = fs.readFileSync(pathHandler.queueFile, { encoding: 'utf8' });
      const queue = JSON.parse(data);
      queue.push(payload);
      fs.writeFileSync(pathHandler.queueFile, JSON.stringify(queue), { encoding: 'utf8' });
    }
    else {
      // Just write
      const queue = [payload];
      fs.writeFileSync(pathHandler.queueFile, JSON.stringify(queue), { encoding: 'utf8' });
    }
    return;
  },

};
