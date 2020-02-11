/**
 * @module promisefied
 * This module simply transforms functions that return a callback
 * into functions that return a promise
 */

// Import node modules
const path = require('path');
const { exec } = require('child_process');
const request = require('request');

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));

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
        if (code === 0) resolve(stdoutMessage);
        else {
          logger.error(code);
          console.log(errMessage);
          reject('ChildProcessError');
        }
      });
    });
  },

  request: options => {
    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (!err) resolve({ res, body });
        else {
          console.log(err);
          reject('RequestError');
        }
      });
    });
  },

  jsonParse: string => {
    return new Promise((resolve, reject) => {
      try {
        resolve(JSON.parse(string));
      }
      catch (e) {
        reject('JSONparseSyntaxError');
      }
    });
  },
};
