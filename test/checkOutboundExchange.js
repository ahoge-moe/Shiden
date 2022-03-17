/**
 * @overview
 * This test assumes the broker is installed and running on localhost
 * on standard port (5672). In case you use a different host, port
 * or credentials, connections settings would require adjusting.
 */

const amqp = require('amqplib');
const logger = require('@wizo06/logger');
const path = require('path');

const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const { printMessageAsTable } = require(path.join(process.cwd(), 'src/utils/workerHelper.js'));
const { jsonParse } = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

(async () => {
  try {
    const connection = await amqp.connect(loadConfigFile().broker.outbound);
    connection.on('close', (err) => { logger.error(`Connection close: ${err}`) });
    connection.on('error', (err) => { logger.error(`Connection error: ${err}`) });
    const channel = await connection.createChannel();
    channel.on('close', (err) => { logger.error(`Channel close: ${err}`) });
    channel.on('error',   (err) => { logger.error(`Channel error: ${err}`) });

    await channel.checkExchange(loadConfigFile().broker.outbound.exchange);
    const ok = await channel.assertQueue('', { exclusive: true });
    logger.info(`Binding exchange ${loadConfigFile().broker.outbound.exchange} to queue ${ok.queue}`);
    await channel.bindQueue(ok.queue, loadConfigFile().broker.outbound.exchange, '');
    logger.info(`Listening queue ${ok.queue} for incoming messages...`);
    await channel.consume(ok.queue, async msg => {
      if (msg == null) {
        logger.error('msg is null');
        connection.close();
        process.kill(1);
      }

      const msgParsed = await jsonParse(msg.content);
      printMessageAsTable(msgParsed);
      connection.close();
      process.kill(0);
    });
  }
  catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();