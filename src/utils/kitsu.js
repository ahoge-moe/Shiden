/**
 * @module kitsu
 * This module handles requests to Kitsu
 */

// Import node modules
const path = require('path');

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

module.exports = kitsu = {
  /**
   * Query Kitsu by show name and return the kitsu slug
   * @param {{string}} showName - Name of the shoe
   * @return {{Promise<string>}} - Returns the kitsu slug
   */
  query: showName => {
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          url: encodeURI(`https://kitsu.io/api/edge/anime?filter[text]=${showName}`),
          method: 'GET',
        };
        const response = await promisefied.request(options);

        if (response.res.statusCode === 200) {
          const parsedBody = JSON.parse(response.body);
          if (parsedBody.data[0]) {
            if (parsedBody.data[0].attributes) {
              return resolve(parsedBody.data[0].attributes.slug);
            }
            else {
              return resolve('');
            }
          }
          else {
            return resolve('');
          }
        }
        else {
          return resolve('');
        }
      }
      catch (e) {
        return resolve('');
      }
    });
  },
};
