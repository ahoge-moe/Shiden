/**
 * @module config
 * This module handles loading config file
 */

// Import node modules
const path = require('path');
const fs = require('fs');
require('toml-require').install({ toml: require('toml') });

// master will be set to TRUE if current git branch name is 'master'
const master = ('master' === fs.readFileSync(path.join(process.cwd(), '.git/HEAD'), { encoding: 'utf8' }).match(/ref: refs\/heads\/([^\n]+)/)[1]);

try {
  if (master) module.exports = require(path.join(process.cwd(), 'conf/user_config.toml'));
  else module.exports = require(path.join(process.cwd(), 'conf/dev_config.toml'));
}
catch (e) {
  Logger.error(e);
  Logger.critical(`"conf/user_config.toml" not found`);
  process.kill(process.pid);
}
