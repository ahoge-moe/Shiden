/**
 * @module notification
 * This module handles getting metadata of the show from Anilist
 * and then sending notification to discord webhooks
 */

// Import node modules
const path = require('path');
const util = require('util');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const anilist = require(path.join(process.cwd(), 'src/utils/anilist.js'));
const kitsu = require(path.join(process.cwd(), 'src/utils/kitsu.js'));
const animeOfflineDatabase = require(path.join(process.cwd(), 'src/utils/animeOfflineDatabase.js'));
const CONFIG = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

const send = async (job, errorCode) => {
  try {
    if (job.showName) {
      const anilistResponse = await anilist.query(job.showName);
      const kitsuResponse = await kitsu.query(job.showName);
      const aniDBID = await animeOfflineDatabase.query(anilistResponse);
      const embed = buildEmbeds(anilistResponse, kitsuResponse, aniDBID, errorCode, job);
      await postToWebhook(errorCode, embed);
    }
    else {
      const embed = buildEmbeds(undefined, undefined, undefined, errorCode, job);
      await postToWebhook(errorCode, embed);
    }
    return;
  }
  catch (e) {
    logger.error(e);
    return;
  }
};

const buildEmbeds = (anilistResponse, kitsuResponse, aniDBID, errorCode, job) => {
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
        timestamp: (new Date()).toISOString(),
        color: red,
        image: {
          url: 'https://firebasestorage.googleapis.com/v0/b/shiden-e263a.appspot.com/o/Untitled-1-01.png?alt=media&token=ca800898-a8a4-4544-b5c2-52158026753f',
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
          title: path.basename(job.sourceFile),
          timestamp: (new Date()).toISOString(),
          color: purple,
          footer: {
            text: anilistResponse.title.romaji,
          },
          image: {
            url: 'https://firebasestorage.googleapis.com/v0/b/shiden-e263a.appspot.com/o/Untitled-1-01.png?alt=media&token=ca800898-a8a4-4544-b5c2-52158026753f',
          },
          thumbnail: {
            url: anilistResponse.coverImage.extraLarge,
          },
          author: {
            name: `Available now`,
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
        title: path.basename(job.sourceFile),
        timestamp: (new Date()).toISOString(),
        color: purple,
        image: {
          url: 'https://firebasestorage.googleapis.com/v0/b/shiden-e263a.appspot.com/o/Untitled-1-01.png?alt=media&token=ca800898-a8a4-4544-b5c2-52158026753f',
        },
        thumbnail: {
          url: 'https://discordapp.com/assets/f8389ca1a741a115313bede9ac02e2c0.svg',
        },
        author: {
          name: `Available now`,
        },
      },
    ],
  };


  return { success: successEmbedNoMetadata, failed: failedEmbed };
};

const postToWebhook = (errorCode, embed) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (webhook of CONFIG.notification.discordWebhooks) {
        const options = {
          url: webhook.url,
          method: 'POST',
          json: (typeof errorCode === 'undefined') ? embed.success : embed.failed,
        };

        logger.info(`Sending request to ${webhook.name}`);
        const response = await promisefied.request(options);
        if (response.res.errorCode === 204) {
          logger.success(`Successful sent with return of ${response.res.errorCode}`);
        }
        else {
          logger.debug(response.res.errorCode);
          logger.debug(util.inspect(response.body));
          console.log(util.inspect(anilistResponse, { depth: null, colors: true }));
        }
      }

      resolve();
    }
    catch (e) {
      logger.error(e);
      resolve();
    }
  });
};

module.exports = {
  send,
};
