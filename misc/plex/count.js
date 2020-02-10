/**
 * @fileoverview Get the number of .mkv files in each show in Premiered
 */

// Import node modules
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import helpers
const Logger = require(path.join(process.cwd(), 'src/shared/utils/logger.js'));
const Promisefied = require(path.join(process.cwd(), 'src/shared/utils/promisefied.js'));

// Import config
const Paths = require(path.join(process.cwd(), 'src/shared/utils/paths.js'));
const { remote } = require(path.join(process.cwd(), 'src/shared/utils/config.js'));

const REMOTE = `${remote.plex}Premiered`;

(async () => {
  try {
    const command = `${Paths.rclonePath} lsf "${REMOTE}" --dirs-only -d=false`;
    const response = await Promisefied.exec(command);
    const folders = response.split('\n').slice(0, -1);

    for (anilistName of folders) {
      try {
        const command = `${Paths.rclonePath} size "${REMOTE}/${anilistName}" --json --exclude "*.{jpg,png}"`;
        const response = await Promisefied.exec(command);
        const count = JSON.parse(response).count;
        const size = JSON.parse(response).bytes;
        Logger.info(`${anilistName}`);
        Logger.info(`  ${count}`);
        Logger.info(`  ${Math.round(size * 0.000001)} MB`);
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
