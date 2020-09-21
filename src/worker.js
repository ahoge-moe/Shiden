const amqp = require('amqplib');
const logger = require('logger');
const path = require('path');

const configHandler = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const processNextJob = require(path.join(process.cwd(), 'src/utils/processor.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const payloadHandler = require(path.join(process.cwd(), 'src/utils/payloadHandler.js'));

(async () => {
  try {
    queueHandler.wipe();
    tempHandler.destroy();
    
    const url = {
      protocol: configHandler.loadConfigFile().broker.protocol,
      hostname: configHandler.loadConfigFile().broker.host,
      port: configHandler.loadConfigFile().broker.port,
      // username: configHandler.loadConfigFile().broker.username,
      // password: configHandler.loadConfigFile().broker.password,
      heartbeat: configHandler.loadConfigFile().broker.heartbeat,
    };

    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();

    channel.on('close', () => { logger.error('Close event emitted!') });
    channel.on('error', err => { logger.error('Error event emitted!') });

    await channel.prefetch(configHandler.loadConfigFile().broker.prefetch);

    await channel.checkQueue(configHandler.loadConfigFile().broker.queue);

    await channel.consume(configHandler.loadConfigFile().broker.queue, async (msg) => {
      if (msg == null) return;
      
      try {
        // Check for JSON syntax. If it has wrong syntax, catch() will handle the error
        const payload = await promisefied.jsonParse(msg.content);

        // Check for required keys
        const requiredKeys = ['inputFile', 'outputFolder'];
        if (!payloadHandler.payloadHasAllRequiredKeys(payload, requiredKeys)) throw 'Missing required key';

        // Check for schema
        const schema = {
          inputFile: 'string',
          outputFolder: 'string',
          showName: 'string',
          subtitleFile: 'string',
          subtitleOffset: 'number',
          videoIndex: 'number',
          audioIndex: 'number',
          subIndex: 'number',
          fontStyle: 'string',
          fontSize: 'number',
        }
        if (!payloadHandler.payloadHasValidSchema(payload, schema)) throw 'Invalid schema';

        logger.success(`*************************`, logger.colors.magenta);
        for ([key, value] of Object.entries(payload)) {
          logger.success(`Loaded ${key}: ${logger.colors.bright}${value}`);
        }
        logger.success(`*************************`, logger.colors.magenta);

        try {
          queueHandler.push(payload);
          await processNextJob();
          channel.ack(msg);

        }
        catch (e) {
          logger.error(e);
          channel.nack(msg, false, true); // nack
        }
      }
      catch (e) {
        logger.error(e);
        channel.nack(msg, false, false); // reject
      }
    }, {
      noAck: false
    });
  }
  catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();