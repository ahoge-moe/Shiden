/**
 * @fileoverview Looks up the aniDB ID for all shows that don't already have the ID in Premiered
 * and appends it to the folder name like so "Naruto ~ ナルト [anidb-XXXX]".
 * This ID is useful for Plex's metadata Agent "HamaTV".
 */

// Import node modules
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import helpers
const Logger = require(path.join(process.cwd(), 'src/shared/utils/logger.js'));
const Promisefied = require(path.join(process.cwd(), 'src/shared/utils/promisefied.js'));
const Anilist = require(path.join(process.cwd(), 'src/shared/automata/anilist.js'));
const AnimeOfflineDatabase = require(path.join(process.cwd(), 'src/shared/automata/animeOfflineDatabase.js'));
const Paths = require(path.join(process.cwd(), 'src/shared/utils/paths.js'));
const { remote } = require(path.join(process.cwd(), 'src/shared/utils/config.js'));

(async () => {
  try {
    const command = `${Paths.rclonePath} lsf "${remote.plex}Premiered" --dirs-only -d=false --exclude "*\[anidb-*\]/"`;
    const response = await Promisefied.exec(command);
    const folders = response.split('\n').slice(0, -1);

    for (anilistName of folders) {
      try {
        const anilistEngName = anilistName.split('~')[0].trim();
        const anilistResponse = await Anilist.query(anilistEngName);
        if (anilistResponse) {
          const anidbID = await AnimeOfflineDatabase.query(anilistResponse.id);

          if (anidbID === '') Logger.error(`${anilistName} not found in AniDB`);

          // Move shows from Premiered to Pending
          Logger.info(`${anilistName} [anidb-${anidbID}]`);
          let command = `${Paths.rclonePath} move "${remote.plex}Premiered/${anilistName}"`;
          command += ` "${remote.plex}Pending/${anilistName} [anidb-${anidbID}]"`;
          command += ` ${flags.rclone}`;
          await Promisefied.exec(command);
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
