/**
 * @module worker
 * This is the entry point of Shiden.
 * It connects to the inbound broker and listens to a queue for messages.
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
    logger.info(`Attempting to connect to inbound broker`);
    if (currentAttempt !== 1) logger.info(`Current retry: #${currentAttempt - 1}`);

    try {
      const connection = await amqp.connect(loadConfigFile().broker.inbound);
      workerHelper.setupEventsForConnection(connection, operation);
      const channel = await connection.createChannel();
      workerHelper.setupEventsForChannel(channel, operation);
      await channel.prefetch(1);
      const ok = await channel.checkQueue(loadConfigFile().broker.inbound.queue);
      if (ok) logger.success(`Connection to inbound broker successful`);
      operation.reset();

      await channel.consume(loadConfigFile().broker.inbound.queue, async (msg) => {
        // msg is null when queue is deleted OR if channel.cancenl() is called
        if (msg == null) {
          logger.error(`Inbound queue has been deleted`);
          // Also kill the current connection to avoid creating new connections to the broker
          connection.close();
          process.env.killChildProcess = 'true';
          const interval = operation._timeouts[0];
          if (operation.retry(new Error)) return logger.warning(`Attempt to reconnect in ${interval / 1000} seconds`);
          workerHelper.bail(); // "retries" has been reached. Exit.
        }

        try {
          const { shidenJob, originalMessage } = await workerHelper.validateMessage(msg);

          logger.success(`Valid Shiden Job received from inbound broker`, logger.colors.magenta);
          workerHelper.printMessageAsTable(shidenJob);

          try {
            await processJob(shidenJob, originalMessage);
            logger.success(`Ack'ing inbound message`);
            channel.ack(msg);
          }
          catch (e) {
            logger.error(e);
            if (e === 'childProcessKilled') return;
            logger.error(`Nack'ing inbound message`);
            channel.nack(msg, false, true); // nack
          }
        }
        catch (e) {
          logger.error(e);
          logger.error(`Reject'ing inbound message`);
          channel.nack(msg, false, false); // reject
        }
      }, {
        noAck: false
      });
    }
    catch (e) {
      logger.error(e);
      const interval = operation._timeouts[0];
      if (operation.retry(new Error)) return logger.warning(`Attempt to reconnect in ${interval / 1000} seconds`);
      workerHelper.bail(); // "retries" has been reached. Exit.
    }
  })
})();