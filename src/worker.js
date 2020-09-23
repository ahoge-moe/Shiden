/**
 * @module worker
 * This is the entry point of Shiden.
 * It connects to the broker and listens to a queue for messages.
 */
const amqp = require('amqplib');
const logger = require('logger');
const path = require('path');
const retry = require('retry');

const workerHelper = require(path.join(process.cwd(), 'src/utils/workerHelper.js'));
const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const processJob = require(path.join(process.cwd(), 'src/utils/processJob.js'));

(() => {
  const operation = retry.operation(loadConfigFile().retry);

  operation.attempt(async currentAttempt => {
    logger.info(`Attempting to connect to broker`);
    if (currentAttempt !== 1) logger.info(`Current retry: #${currentAttempt - 1}`);

    try {
      const connection = await amqp.connect(loadConfigFile().broker);
      workerHelper.setupEventsForConnection(connection, operation);
      const channel = await connection.createChannel();
      workerHelper.setupEventsForChannel(channel, operation);
      await channel.prefetch(1);
      const ok = await channel.checkQueue(loadConfigFile().broker.queue);
      if (ok) logger.success(`Connection successful`);
      operation.reset();

      await channel.consume(loadConfigFile().broker.queue, async (msg) => {
        if (msg == null) return channel.nack(msg, false, false); // reject

        try {
          const msg = workerHelper.validateMessage(msg);

          logger.success(`Job received from broker`);
          workerHelper.printMessageAsTable(msg);

          try {
            await processJob(msg);
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
      workerHelper.bail();
    }
  })
})();