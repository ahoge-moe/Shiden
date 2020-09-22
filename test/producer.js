/**
 * @overview
 * This test assumes the broker is installed and running on localhost 
 * on standard port (5672). In case you use a different host, port 
 * or credentials, connections settings would require adjusting.
 */

const amqp = require('amqplib');
const logger = require('logger');
const path = require('path');

const configHandler = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

(async () => {
  try {
    const url = {
      protocol: configHandler.loadConfigFile().broker.protocol,
      hostname: configHandler.loadConfigFile().broker.host,
      port: configHandler.loadConfigFile().broker.port,
      username: configHandler.loadConfigFile().broker.username,
      password: configHandler.loadConfigFile().broker.password,
      heartbeat: configHandler.loadConfigFile().broker.heartbeat,
    };

    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    channel.on('close', () => { logger.error('Close event emitted!') });
    channel.on('error', err => { logger.error('Error event emitted!') });
    await channel.assertQueue(configHandler.loadConfigFile().broker.queue, { durable: false });

    const msg = {
      "inputFile": "Premiered/Grand Blue/Grand Blue - 01 [1080p].mkv",
      "outputFolder": "Premiered [Hardsub]/Grand Blue",
      "showName": "Grand Blue"
    };

    await channel.sendToQueue(configHandler.loadConfigFile().broker.queue, Buffer.from(JSON.stringify(msg)), { persistent: false });
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