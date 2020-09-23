/**
 * @overview
 * This test assumes the broker is installed and running on localhost 
 * on standard port (5672). In case you use a different host, port 
 * or credentials, connections settings would require adjusting.
 */

const amqp = require('amqplib');
const logger = require('logger');
const path = require('path');

const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

(async () => {
  try {
    const connection = await amqp.connect(loadConfigFile().broker.inbound);
    const channel = await connection.createChannel();
    channel.on('close', () => { logger.error('Close event emitted!') });
    channel.on('error', err => { logger.error('Error event emitted!') });
    await channel.assertQueue(loadConfigFile().broker.inbound.queue, { durable: false });

    const msg = {
      "inputFile": "Premiered/Grand Blue/Grand Blue - 01 [1080p].mkv",
      "outputFolder": "Premiered [Hardsub]/Grand Blue",
      "showName": "Grand Blue"
    };

    logger.info(`Sending message to queue`);
    await channel.sendToQueue(
      loadConfigFile().broker.inbound.queue, 
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
})();