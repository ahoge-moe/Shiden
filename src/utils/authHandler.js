/**
 * @module authHandler
 * This module handles loading auth file and check for authorization from incoming requests
 */

// Import node modules
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));

// master will be set to TRUE if current git branch name is 'master'
const master = ('master' === fs.readFileSync(path.join(process.cwd(), '.git/HEAD'), { encoding: 'utf8' }).match(/ref: refs\/heads\/([^\n]+)/)[1]);

module.exports = authHandler = {
  /**
   * Checks if token from incoming request is authorized
   * @param {{string}} tokenFromRequest
   * @return {{boolean}}
   */
  isAuthorized: tokenFromRequest => {
    try {
      let authPath;
      if (master) authPath = path.join(process.cwd(), 'conf/user_auth.yml');
      else authPath = path.join(process.cwd(), 'conf/dev_auth.yml');
      const authFile = yaml.safeLoad(fs.readFileSync(authPath, 'utf8'));

      for ([user, token] of Object.entries(authFile)) {
        if (token === tokenFromRequest) {
          logger.success(`Request authorized. Matching key was sent from ${logger.colors.green}${user}`);
          return true;
        }
      }
      logger.error(`Request denied`);
      return false;
    }
    catch (e) {
      logger.error(`Request denied - "conf/user_auth.yml" not found`);
      logger.error(`Please run "prepare.sh" and edit "conf/user_auth.yml" as needed.`);
      process.kill(process.pid);
      return false;
    }
  },
};
