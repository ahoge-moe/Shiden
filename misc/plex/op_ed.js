/**
 * @fileoverview Print all files in Premiered that have the substring "OP", "op", "ED" or "ed"
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

(async () => {
  try {
    const command = `${Paths.rclonePath} lsf "${remote.plex}Premiered" -R --files-only --ignore-case --include "*{OP,ED}*"`;
    const response = await promisefied.exec(command);
    const files = response.split('\n').slice(0, -1);
    logger.info(files);
  }
  catch (e) {
    logger.error(e);
  }
})();
