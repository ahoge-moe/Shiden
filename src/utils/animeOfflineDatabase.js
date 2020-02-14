/**
 * @module animeOfflineDatabase
 * This module handles requests to AOD
 */

/**
 * https://github.com/BeeeQueue/arm-server
 * https://github.com/manami-project/anime-offline-database/
 */

// Import node modules
const path = require('path');

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

module.exports = animeOfflineDatabase = {
  /**
   * Query AOD with Anilist ID and return AniDB ID
   * @param {{Object}} anilistResponse - Response from querying Anilist API
   * @return {{Promise<string>}} - AniDB ID
   */
  query: anilistResponse => {
    return new Promise(async (resolve, reject) => {
      if (anilistResponse) {
        const options = {
          url: `https://relations.yuna.moe/api/ids?source=anilist&id=${anilistResponse.id}`,
          method: 'GET',
        };

        const response = await promisefied.request(options);
        if (response.res.statusCode === 200) {
          const parsedBody = JSON.parse(response.body);

          if (parsedBody.anidb) {
            return resolve(parsedBody.anidb);
          }
          else {
            return resolve('');
          }
        }
      }
      else {
        return resolve('');
      }
    });
  },
};
