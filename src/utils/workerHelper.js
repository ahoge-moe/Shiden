/**
 * @module workerHelper
 * Helper functions for @worker
 */
const logger = require('logger');
const { table } = require('table');

const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const messageHandler = require(path.join(process.cwd(), 'src/utils/messageHandler.js'));

const bail = () => {
  logger.warning(`Maximum number of retries ${loadConfigFile().retry.retries} has been reached.`);
  logger.warning(`Exiting with code 1`);
  process.exit(1);
};

const validateMessage = (msg) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check for JSON syntax. If it has wrong syntax, catch() will handle the error
      const msgParsed = await promisefied.jsonParse(msg.content);
      // Check for required keys
      if (!messageHandler.messageHasRequiredKeys(msgParsed)) return reject('Missing required key');
      // Check for schema
      if (!messageHandler.messageHasValidSchema(msgParsed)) return reject('Invalid schema');

      resolve(msgParsed);
    }
    catch (e) {
      return reject(e);
    }
  });
};

const setupEventsForConnection = (connection, operation) => {
  connection.on('close', (err) => {
    // TODO kill child process from processJob
    logger.error(`Connection close: ${err}`);
    const closedByOperatorMessage = `Error: Connection closed: 320 (CONNECTION-FORCED) with message "CONNECTION_FORCED - ${loadConfigFile().broker.closeMessage}"`;
    if (`${err}` === closedByOperatorMessage) return; // Stop retry
    if (operation.retry(new Error)) return; // Keep retrying until "retries" has been reached OR until forever
    bail(); // "retries" has been reached. Exit.
  });
  connection.on('error', (err) => { logger.error(`Connection error: ${err}`) });
  connection.on('blocked', (reason) => { logger.error(`Connection blocked: ${reason}`) });
  connection.on('unblocked', (foo) => { logger.error(`Connection unblocked: ${foo}`) });
};

const setupEventsForChannel = (channel, operation) => {
  channel.on('close', () => {
    // TODO kill child process from processJob
    logger.error(`Channel close`);
  });
  channel.on('error', err => { logger.error(`Channel error: ${err}`) });
  channel.on('return', msg => { logger.error(`Channel return: ${msg}`) });
  channel.on('drain', (foo) => { logger.error(`Channel drain: ${foo}`) });
};

const printMessageAsTable = (msg) => {
  const data = [];
  for ([key, value] of Object.entries(msg)) {
    data.push([key, value]);
  }
  process.stdout.write(table(data, { singleLine: true }));
};

module.exports = {
  bail,
  validateMessage,
  setupEventsForConnection,
  setupEventsForChannel,
  printMessageAsTable
};