/**
 * @fileoverview Get the number of .mkv files in each show in Premiered
 */

// Import node modules
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import helpers
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

// Import config
const Paths = require(path.join(process.cwd(), 'src/utils/paths.js'));
const { remote } = require(path.join(process.cwd(), 'src/utils/config.js'));

const REMOTE = `${remote.plex}Premiered`;

(async () => {
  try {
    const command = `${Paths.rclonePath} lsf "${REMOTE}" --dirs-only -d=false`;
    const response = await promisefied.exec(command);
    const folders = response.split('\n').slice(0, -1);

    for (anilistName of folders) {
      try {
        const command = `${Paths.rclonePath} size "${REMOTE}/${anilistName}" --json --exclude "*.{jpg,png}"`;
        const response = await promisefied.exec(command);
        const count = JSON.parse(response).count;
        const size = JSON.parse(response).bytes;
        logger.info(`${anilistName}`);
        logger.info(`  ${count}`);
        logger.info(`  ${Math.round(size * 0.000001)} MB`);
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
