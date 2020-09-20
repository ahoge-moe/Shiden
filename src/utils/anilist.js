/**
 * @module anilist
 * This module handles requests to Anilist GraphQL API
 */

// Import node modules
const path = require('path');
const logger = require('logger');

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

module.exports = anilist = {
  /**
   * Query by show name and return the response
   * @param {{string}} showName - Name of the show
   * @return {{Promise<Object>}} - Returns the response from Anilist, otherwise return undefined
   */
  query: showName => {
    return new Promise(async (resolve, reject) => {
      try {
        const variables = {
          name: showName,
        };

        const options = {
          url: 'https://graphql.anilist.co',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: `
            query ($name: String){
              Media(search: $name, type: ANIME) {
                id
                idMal
                title {
                  romaji
                  native
                }
                format
                status
                season
                seasonYear
                siteUrl
                episodes
                duration
                source (version: 2)
                coverImage {
                  large
                  extraLarge
                }
                bannerImage
                genres
                averageScore
                relations {
                  edges {
                    relationType (version: 2)
                    node {
                      title {
                        romaji
                      }
                      siteUrl
                      format
                    }
                  }
                }
                studios {
                  nodes {
                    name
                    siteUrl
                  }
                }
                nextAiringEpisode {
                  airingAt
                  timeUntilAiring
                  episode
                }
              }
            }

            `,
            variables: variables,
          }),
        };

        const response = await promisefied.request(options);

        if (response.res.statusCode === 200) {
          const parsedBody = JSON.parse(response.body);
          if (parsedBody.data) {
            return resolve(parsedBody.data.Media);
          }
          else {
            return resolve(undefined);
          }
        }
        else {
          logger.error(response.body);
          return resolve(undefined);
        }
      }
      catch (e) {
        logger.error(e);
        return resolve(undefined);
      }
    });
  },
};
