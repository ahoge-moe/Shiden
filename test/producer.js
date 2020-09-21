const amqp = require('amqplib');
const logger = require('logger');
const path = require('path');

const configHandler = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

(async () => {
  try {
    const url = {
      protocol: configHandler.loadConfigFile().rabbitmq.protocol,
      hostname: configHandler.loadConfigFile().rabbitmq.host,
      port: configHandler.loadConfigFile().rabbitmq.port,
      // username: configHandler.loadConfigFile().rabbitmq.username,
      // password: configHandler.loadConfigFile().rabbitmq.password,
      heartbeat: configHandler.loadConfigFile().rabbitmq.heartbeat,
    };

    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    channel.on('close', () => { logger.error('Close event emitted!') });
    channel.on('error', err => { logger.error('Error event emitted!') });
    await channel.checkQueue(configHandler.loadConfigFile().rabbitmq.queue);

    const msg = {
      "inputFile": "Premiered/Grand Blue/Grand Blue - 01 [1080p].mkv",
      "outputFolder": "Premiered [Hardsub]/Grand Blue",
      "showName": "Grand Blue"
    };

    await channel.sendToQueue(configHandler.loadConfigFile().rabbitmq.queue, Buffer.from(JSON.stringify(msg)), { persistent: false });
    setTimeout(function () {
      connection.close();
      process.exit(0);
    }, 500);
  }
  catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();