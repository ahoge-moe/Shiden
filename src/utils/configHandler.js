/**
 * @module configHandler
 * This module handles loading config file
 */

// Import node modules
const path = require('path');
const fs = require('fs');
const logger = require('@wizo06/logger');
require('toml-require').install({ toml: require('toml') });

module.exports = configHandler = {
  loadConfigFile: () => {
    try {
      return require(path.join(process.cwd(), 'config/user_config.toml'));
    }
    catch (e) {
      logger.error(e);
      logger.error(`Request denied - config file not found`);
      logger.error(`Please run "prepare.sh"`);
      process.kill(process.pid);
    }
  },
}