/**
 * @module notification
 * This module handles sending messages to the broker
 */

// Import node modules
const amqp = require('amqplib');
const path = require('path');
const logger = require('logger');
const fs = require('fs');
const retry = require('retry');

// Import custom modules
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

/**
 * Fetches metadata of the show and sends it to discord webhooks
 * @param {{Object}} job - Current job
 * @param {{string}} outputFileName - Name of outputFile
 * @return {{void}}
 */
const sendToBroker = (job, outputFileName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await amqp.connect(loadConfigFile().broker.outbound);
      const channel = await connection.createChannel();
      channel.on('close', () => { logger.error('Close event emitted!') });
      channel.on('error', err => { logger.error('Error event emitted!') });
      await channel.assertQueue(loadConfigFile().broker.outbound.queue, { durable: false });

      const tempFolder = tempHandler.getTempFolderPath();
      const transcodedFile = path.join(tempFolder, outputFileName);
      const fileStats = fs.statSync(transcodedFile);

      const msg = {
        'show': job.showName ?? '...',
        'episode': outputFileName,
        'filesize': fileStats.size,
        'sub': 'HARDSUB'
      };

      logger.info(`Sending message to queue`);
      await channel.sendToQueue(
        loadConfigFile().broker.outbound.queue,
        Buffer.from(JSON.stringify(msg)),
        { persistent: false }
      );
      setTimeout(function () {
        connection.close();
        logger.info(`Exiting producer.js`);
        process.exit(0);
      }, 500);
    }
    catch (e) {
      logger.error(e);
      process.exit(1);
    }
  });
};

module.exports = {
  sendToBroker,
};
