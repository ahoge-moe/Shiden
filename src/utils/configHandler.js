/**
 * @module configHandler
 * This module handles loading config file
 */

// Import node modules
const path = require('path');
const fs = require('fs');
const logger = require('logger');
require('toml-require').install({ toml: require('toml') });

// master will be set to TRUE if current git branch name is 'master'
const master = ('master' === fs.readFileSync(path.join(process.cwd(), '.git/HEAD'), { encoding: 'utf8' }).match(/ref: refs\/heads\/([^\n]+)/)[1]);

module.exports = configHandler = {
  loadConfigFile: () => {
    try {
      if (master) return require(path.join(process.cwd(), 'conf/user_config.toml'));
      else return require(path.join(process.cwd(), 'conf/dev_config.toml'));
    }
    catch (e) {
      logger.error(e);
      logger.error(`Request denied - config file not found`);
      logger.error(`Please run "prepare.sh"`);
      process.kill(process.pid);
    }
  },

  /**
     * Checks if token from incoming request is authorized
     * @param {{string}} keyFromRequest
     * @return {{boolean}}
     */
  isAuthorized: keyFromRequest => {
    for (auth of configHandler.loadConfigFile().express.authorization) {
      if (auth.key === keyFromRequest) {
        logger.success(`Request authorized. Matching key was sent from ${logger.colors.green}${auth.name}`);
        return true;
      }
    }
    logger.error(`Request denied`);
    return false;
  },

}