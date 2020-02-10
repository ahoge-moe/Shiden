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
const Logger = require(path.join(process.cwd(), 'src/shared/utils/logger.js'));
const Promisefied = require(path.join(process.cwd(), 'src/shared/utils/promisefied.js'));
const Anilist = require(path.join(process.cwd(), 'src/shared/automata/anilist.js'));
const AnimeOfflineDatabase = require(path.join(process.cwd(), 'src/shared/automata/animeOfflineDatabase.js'));

// Import config
const Paths = require(path.join(process.cwd(), 'src/shared/utils/paths.js'));
const { flags } = require(path.join(process.cwd(), 'src/shared/utils/config.js'));
const { remote } = require(path.join(process.cwd(), 'src/shared/utils/config.js'));

(async () => {
  try {
    /** For ALL shows in Airing */
    // let command = `${Paths.rclonePath} lsf "${remote.plex}Airing" --dirs-only -d=false`;
    // let response = await Promisefied.exec(command);
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

          if (anidbID === '') Logger.error(`${anilistName} not found in AniDB`);

          // Move shows from Airing to Pending
          Logger.info(`Moving ${anilistName} ~ ${anilistResponse.title.native} [anidb-${anidbID}]`);
          let command = `${Paths.rclonePath} move "${remote.plex}Airing/${anilistName}"`;
          command += ` "${remote.plex}Pending/${anilistName} ~ ${anilistResponse.title.native} [anidb-${anidbID}]"`;
          command += ` ${flags.rclone}`;
          const response = await Promisefied.exec(command);
          Logger.info(response);
        }
        else {
          Logger.error(`${anilistName} not found in Anilist`);
        }
      }
      catch (e) {
        Logger.error(e);
      }
    }
  }
  catch (e) {
    Logger.error(e);
  }
})();
