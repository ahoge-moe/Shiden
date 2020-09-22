const amqp = require('amqplib');
const logger = require('logger');
const path = require('path');
const retry = require('retry');
const { table } = require('table');

const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const processNextJob = require(path.join(process.cwd(), 'src/utils/processor.js'));
const messageHandler = require(path.join(process.cwd(), 'src/utils/messageHandler.js'));

const bail = () => {
  logger.warning(`Maximum number of retries ${loadConfigFile().retry.retries} has been reached.`);
  logger.warning(`Exiting with code 1`);
  process.exit(1);
};

(() => {
  const operation = retry.operation({
    retries: loadConfigFile().retry.retries,
    factor: loadConfigFile().retry.factor,
    minTimeout: loadConfigFile().retry.minTimeout,
    maxTimeout: loadConfigFile().retry.maxTimeout,
    randomize: loadConfigFile().retry.randomize,
    forever: loadConfigFile().retry.forever,
    unref: loadConfigFile().retry.unref,
    maxRetryTime: loadConfigFile().retry.maxRetryTime === 'Infinity' ? Infinity : loadConfigFile().retry.maxRetryTime,
  });

  operation.attempt(async currentAttempt => {
    logger.info(`Attempting to connect to broker`);
    if (currentAttempt !== 1) logger.info(`Current retry: #${currentAttempt - 1}`);

    try {
      const url = {
        protocol: loadConfigFile().broker.protocol,
        hostname: loadConfigFile().broker.host,
        port: loadConfigFile().broker.port,
        username: loadConfigFile().broker.username,
        password: loadConfigFile().broker.password,
        heartbeat: loadConfigFile().broker.heartbeat,
        vhost: loadConfigFile().broker.vhost,
      };

      const connection = await amqp.connect(url);
      connection.on('close', (err) => {
        // TODO kill child process from processNextJob
        logger.error(`Connection close: ${err}`);
        const closedByOperatorMessage = `Error: Connection closed: 320 (CONNECTION-FORCED) with message "CONNECTION_FORCED - ${loadConfigFile().broker.closeMessage}"`;
        if (`${err}` === closedByOperatorMessage) return; // Stop retry
        if (operation.retry(new Error)) return; // Keep retrying until "retries" has been reached OR until forever
        bail(); // "retries" has been reached. Exit.
      });
      connection.on('error', (err) => { logger.error(`Connection error: ${err}`) });
      connection.on('blocked', (reason) => { logger.error(`Connection blocked: ${reason}`) });
      connection.on('unblocked', (foo) => { logger.error(`Connection unblocked: ${foo}`) });

      const channel = await connection.createChannel();
      channel.on('close', () => { 
        // TODO kill child process from processNextJob
        logger.error(`Channel close`); 
      });
      channel.on('error', err => { logger.error(`Channel error: ${err}`) });
      channel.on('return', msg => { logger.error(`Channel return: ${msg}`) });
      channel.on('drain', (foo) => { logger.error(`Channel drain: ${foo}`) });

      await channel.prefetch(1);
      const ok = await channel.checkQueue(loadConfigFile().broker.queue);
      if (ok) logger.success(`Connection successful`);
      operation.reset();

      await channel.consume(loadConfigFile().broker.queue, async (msg) => {
        if (msg == null) return channel.nack(msg, false, false); // reject

        try {
          // Check for JSON syntax. If it has wrong syntax, catch() will handle the error
          const msgParsed = await promisefied.jsonParse(msg.content);
          // Check for required keys
          const requiredKeys = ['inputFile', 'outputFolder'];
          if (!messageHandler.messageHasRequiredKeys(msgParsed, requiredKeys)) throw 'Missing required key';
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
          if (!messageHandler.messageHasValidSchema(msgParsed, schema)) throw 'Invalid schema';

          logger.success(`Job received from broker`);
          const data = [];
          for ([key, value] of Object.entries(msgParsed)) {
            data.push([key, value]);
          }
          process.stdout.write(table(data, { singleLine: true }));

          try {
            await processNextJob(msgParsed);
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
      if (operation.retry(new Error)) return logger.error(e);
      bail();
    }
  })
})();