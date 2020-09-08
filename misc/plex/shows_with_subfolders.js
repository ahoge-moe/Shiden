/**
 * @fileoverview Print all shows in Premiered that have subfolders inside
 */

// Import node modules
const path = require('path');
const logger = require('logger');
require('toml-require').install({ toml: require('toml') });

// Import helpers
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

// Import config
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));
const { remote } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

(async () => {
  try {
    let command = `${pathHandler.rcloneBinary} lsf "${remote.plex}Premiered [Hardsub]" --max-depth=2`;
    command += ` | grep -E ".*\/.*\/.*"`;
    const response = await promisefied.exec(command);
    let folders = response.split('\n').slice(0, -1);
    folders = folders.map(x => x.split('/')[0]);
    folders = [...new Set(folders)];
    logger.info(folders);
  }
  catch (e) {
    logger.error(e);
  }
})();
