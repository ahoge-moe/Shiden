/**
 * @module notification
 * This module handles getting metadata of the show from Anilist
 * and then sending notification to discord webhooks
 */

// Import node modules
const path = require('path');
const util = require('util');
const logger = require('logger');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const anilist = require(path.join(process.cwd(), 'src/utils/anilist.js'));
const kitsu = require(path.join(process.cwd(), 'src/utils/kitsu.js'));
const animeOfflineDatabase = require(path.join(process.cwd(), 'src/utils/animeOfflineDatabase.js'));
const configHandler = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const version = require(path.join(process.cwd(), 'package.json')).version;

/**
 * Fetches metadata of the show and sends it to discord webhooks
 * @param {{Object}} job - Current job
 * @param {{string}} outputFileName - Name of outputFile
 * @param {{number}} errorCode - error code from @worker
 * @return {{void}}
 */
const send = (job, outputFileName, errorCode) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (job.showName) {
        const anilistResponse = await anilist.query(job.showName);
        const kitsuResponse = await kitsu.query(job.showName);
        const aniDBID = await animeOfflineDatabase.query(anilistResponse);
        const embed = buildEmbeds(anilistResponse, kitsuResponse, aniDBID, errorCode, job, outputFileName);
        postToWebhook(errorCode, embed);
      }
      else {
        const embed = buildEmbeds(undefined, undefined, undefined, errorCode, job, outputFileName);
        postToWebhook(errorCode, embed);
      }
      resolve();
    }
    catch (e) {
      logger.error(e);
      resolve();
    }
  });
};

/**
 * Takes metadata and builds an embed for discord webhooks
 * @param {{Object}} anilistResponse 
 * @param {{string}} kitsuResponse 
 * @param {{string}} aniDBID 
 * @param {{number}} errorCode 
 * @param {{Object}} job 
 * @return {{Object}} - Returns an embed for successful job completion and one for failed job completion
 */
const buildEmbeds = (anilistResponse, kitsuResponse, aniDBID, errorCode, job, outputFileName) => {
  // Color
  const purple = 8978687;
  const red = 16711680;

  // Failed embed
  const arrOfFields = [];
  for (const [key, value] of Object.entries(job)) {
    arrOfFields.push({ name: key, value: value });
  }

  const failedEmbed = {
    embeds: [
      {
        title: `Error code: ${errorCode}`,
        url: 'https://github.com/wizo06/Shiden#error-codes',
        timestamp: (new Date()).toISOString(),
        color: red,
        footer: {
          text: `Shiden v${version}`,
        },
        fields: arrOfFields,
      },
    ],
  };

  if (typeof anilistResponse !== 'undefined') {
    // Success embed with metadata
    const successEmbed = {
      embeds: [
        {
          title: outputFileName,
          timestamp: (new Date()).toISOString(),
          color: purple,
          footer: {
            text: `Shiden v${version}`,
          },
          thumbnail: {
            url: anilistResponse.coverImage.extraLarge,
          },
          author: {
            name: anilistResponse.title.romaji,
          },
          fields: [
            {
              name: 'Links',
              value: `[MAL](https://myanimelist.net/anime/${anilistResponse.idMal}) | [Anilist](${anilistResponse.siteUrl}) | [Kitsu](https://kitsu.io/anime/${kitsuResponse}) | [AniDB](https://anidb.net/anime/${aniDBID})`,
              inline: true,
            },
          ],
        },
      ],
    };

    return { success: successEmbed, failed: failedEmbed };
  }

  // Success embed without metadata
  const successEmbedNoMetadata = {
    embeds: [
      {
        title: outputFileName,
        timestamp: (new Date()).toISOString(),
        color: purple,
        footer: {
          text: `Shiden v${version}`,
        },
        thumbnail: {
          url: 'https://discordapp.com/assets/f8389ca1a741a115313bede9ac02e2c0.svg',
        },
        author: {
          name: anilistResponse.title.romaji,
        },
      },
    ],
  };


  return { success: successEmbedNoMetadata, failed: failedEmbed };
};

/**
 * Takes the embed and sends it to discord webhooks
 * @param {{number}} errorCode 
 * @param {{Object}} embed 
 * @return {{void}}
 */
const postToWebhook = async (errorCode, embed) => {
  try {
    for (webhook of configHandler.loadConfigFile().notification.discordWebhooks) {
      const options = {
        url: webhook.url,
        method: 'POST',
        json: (typeof errorCode === 'undefined') ? embed.success : embed.failed,
      };

      logger.info(`Sending request to ${logger.colors.bright}${webhook.name}`);
      const response = await promisefied.request(options);
      if (response.res.statusCode === 204) {
        logger.success(`Successful sent with return of ${logger.colors.bright}${response.res.statusCode}`);
      }
      else {
        logger.debug(response.res.statusCode);
        logger.debug(util.inspect(response.body));
      }
    }

    return;
  }
  catch (e) {
    logger.error(e);
    return;
  }
};

module.exports = {
  send,
};
