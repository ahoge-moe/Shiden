/**
 * @module notification
 * This module handles sending messages to the outbound broker
 */

// Import node modules
const amqp = require('amqplib');
const path = require('path');
const logger = require('logger');
const fs = require('fs');
const version = require(path.join(process.cwd(), 'package.json')).version;

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

const sendToBroker = (job, outputFileName) => {
  return new Promise(async (resolve, reject) => {

    const tempFolder = tempHandler.getTempFolderPath();
    const transcodedFile = path.join(tempFolder, outputFileName);
    const fileStats = fs.statSync(transcodedFile);
    
    const msg = {
      show: job.showName ?? '...',
      episode: outputFileName,
      filesize: fileStats.size,
      sub: 'HARDSUB'
    };

    try {
      // Attempt to send msg to outbound broker
      logger.info(`Attempting to connect to outbound broker`);
      const connection = await amqp.connect(loadConfigFile().broker.outbound);
      connection.on('close', err => { logger.debug(`Connection to outbound broker close: ${err} `) });
      connection.on('error', err => { logger.debug(`Connection to outbound broker error: ${err} `) });
      const channel = await connection.createChannel();
      channel.on('close', (err) => { logger.debug(`Channel to outbound broker close: ${err}`) });
      channel.on('error', err => { logger.debug(`Channel to outbound broker error: ${err}`) });
      const ok = await channel.checkExchange(loadConfigFile().broker.outbound.exchange);
      if (ok) logger.success(`Connection to outbound broker successful`);

      logger.info(`Sending message to outbound exchange: ${loadConfigFile().broker.outbound.exchange}`);
      await channel.publish(
        loadConfigFile().broker.outbound.exchange,
        loadConfigFile().broker.outbound.routingKey,
        Buffer.from(JSON.stringify(msg)),
        { persistent: false }
      );
      setTimeout(function () {
        connection.close();
        logger.success(`Sent to outbound exchange`);
        resolve();
      }, 1000);
    }
    catch (e) {
      // If failed, send msg to discord webhook instead
      logger.error(e);
      try {
        logger.info(`Sending message to discord webhooks instead`);
        // Send to discord webhook
        const json = {
          embeds: [
            {
              title: outputFileName,
              timestamp: (new Date().toISOString()),
              color: 8978687, // purple
              footer: {
                text: `Shiden ${version}`
              },
              thumbnail: {
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Warning.svg/156px-Warning.svg.png'
              },
              author: {
                name: `Failed to send to outbound broker`
              },
              fields: [
                {
                  name: loadConfigFile().broker.outbound.exchange,
                  value: `\`\`\` ${JSON.stringify(msg).replace(/,/g, ',\n')} \`\`\``,
                }
              ]
            }
          ]
        };

        for (const webhook of loadConfigFile().discord.webhooks) {
          const options = {
            url: webhook.url,
            method: 'POST',
            json: json
          };
  
          logger.info(`Sending message to ${webhook.name}`);
          const result = await promisefied.request(options);
          if (result.res.statusCode === 204) {
            logger.success(`Sent to ${webhook.name}`); 
          }
          else {
            // promisefied.request() can be resolve()'d  but status code != 204
            // TODO: decide what to do in this case
          }
        }
        resolve();
      }
      catch (e) {
        // If also failed, reject for now.
        // TODO: maybe save it on a local file
        reject(e);
      }
    }
  });
};

module.exports = {
  sendToBroker,
};
