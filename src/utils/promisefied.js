/**
 * @module promisefied
 * This module simply transforms functions that return a callback
 * into functions that return a promise
 */

// Import node modules
const { exec } = require('child_process');
const logger = require('@wizo06/logger');
const request = require('request');

module.exports = promisefied = {
  exec: (command, options) => {
    return new Promise((resolve, reject) => {
      const checkKillChildProcessFlag = setInterval(() => {
        if (process.env.killChildProcess === 'true') {
          process.env.killChildProcess = 'false';
          reject('childProcessKilled');
          clearInterval(checkKillChildProcessFlag);
          return;
        }
      }, 1000);

      let stdoutMessage = '';
      let errMessage = '';
      logger.debug(`${command}`);
      subprocess = exec(command, options);
      subprocess.stdout.on('data', data => stdoutMessage += data);
      subprocess.stderr.on('data', data => errMessage += data);
      subprocess.on('close', code => {
        if (code === 0) {
          clearInterval(checkKillChildProcessFlag);
          return resolve(stdoutMessage);
        }
        else {
          logger.debug(`Child process exit code: ${code}`);
          logger.debug(errMessage);
          return reject(900);
        }
      });
    });
  },

  request: options => {
    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (!err) return resolve({ res, body });
        else {
          console.log(err);
          return reject(901);
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
