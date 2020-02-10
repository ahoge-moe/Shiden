/**
 * @fileoverview Print all files in Premiered that have the substring "OP", "op", "ED" or "ed"
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
    const command = `${Paths.rclonePath} lsf "${remote.plex}Premiered" -R --files-only --ignore-case --include "*{OP,ED}*"`;
    const response = await Promisefied.exec(command);
    const files = response.split('\n').slice(0, -1);
    Logger.info(files);
  }
  catch (e) {
    Logger.error(e);
  }
})();
