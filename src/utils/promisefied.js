/**
 * @module promisefied
 * This module simply transforms functions that return a callback
 * into functions that return a promise
 */

// Import node modules
const path = require('path');
const { exec } = require('child_process');
const logger = require('logger');

module.exports = promisefied = {
  exec: (command, options) => {
    return new Promise((resolve, reject) => {
      let stdoutMessage = '';
      let errMessage = '';
      logger.debug(`${command}`);
      subprocess = exec(command, options);
      subprocess.stdout.on('data', data => stdoutMessage += data);
      subprocess.stderr.on('data', data => errMessage += data);
      subprocess.on('close', code => {
        if (code === 0) return resolve(stdoutMessage);
        else {
          logger.debug(`Child process exit code: ${code}`);
          logger.debug(errMessage);
          return reject(900);
        }
      });
    });
  },

  jsonParse: string => {
    return new Promise((resolve, reject) => {
      try {
        return resolve(JSON.parse(string));
      }
      catch (e) {
        return reject(902);
      }
    });
  },
};
