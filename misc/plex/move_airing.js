/**
 * @fileoverview Looks up the Japanese name of specific shows in Airing and appends it to the folder name
 * like so "Naruto ~ ナルト".
 * Then, looks up the aniDB ID of each show and appends it to the folder name
 * like so "Naruto ~ ナルト [anidb-XXXX]".
 * This ID is useful for Plex's metadata Agent "HamaTV".
 * Then, moves all those folders from Airing into Pending.
 */

// Import node modules
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import helpers
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const Anilist = require(path.join(process.cwd(), 'src/shared/automata/anilist.js'));
const AnimeOfflineDatabase = require(path.join(process.cwd(), 'src/shared/automata/animeOfflineDatabase.js'));

// Import config
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));
const { flags } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const { remote } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

(async () => {
  try {
    /** For ALL shows in Airing */
    // let command = `${pathHandler.rcloneBinary} lsf "${remote.plex}Airing" --dirs-only -d=false`;
    // let response = await promisefied.exec(command);
    // let AIRING_FOLDERS = response.split('\n').slice(0,-1);

    /**
     * @todo
     */
    /** For specific shows in Airing */
    const AIRING_FOLDERS = ['Enen no Shouboutai', 'Shinchou Yuusha - Kono Yuusha ga Ore TUEEE Kuse ni Shinchou Sugiru'];

    for (anilistName of AIRING_FOLDERS) {
      try {
        const anilistResponse = await Anilist.query(anilistName);
        if (anilistResponse) {
          const anidbID = await AnimeOfflineDatabase.query(anilistResponse.id);

          if (anidbID === '') logger.error(`${anilistName} not found in AniDB`);

          // Move shows from Airing to Pending
          logger.info(`Moving ${anilistName} ~ ${anilistResponse.title.native} [anidb-${anidbID}]`);
          let command = `${pathHandler.rcloneBinary} move "${remote.plex}Airing/${anilistName}"`;
          command += ` "${remote.plex}Pending/${anilistName} ~ ${anilistResponse.title.native} [anidb-${anidbID}]"`;
          command += ` ${flags.rclone}`;
          const response = await promisefied.exec(command);
          logger.info(response);
        }
        else {
          logger.error(`${anilistName} not found in Anilist`);
        }
      }
      catch (e) {
        logger.error(e);
      }
    }
  }
  catch (e) {
    logger.error(e);
  }
})();
