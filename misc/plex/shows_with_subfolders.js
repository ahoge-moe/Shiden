/**
 * @fileoverview Print all shows in Premiered that have subfolders inside
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

(async () => {
  try {
    let command = `${Paths.rclonePath} lsf "${remote.plex}Premiered [Hardsub]" --max-depth=2`;
    command += ` | grep -E ".*\/.*\/.*"`;
    const response = await Promisefied.exec(command);
    let folders = response.split('\n').slice(0, -1);
    folders = folders.map(x => x.split('/')[0]);
    folders = [...new Set(folders)];
    Logger.info(folders);
  }
  catch (e) {
    Logger.error(e);
  }
})();
