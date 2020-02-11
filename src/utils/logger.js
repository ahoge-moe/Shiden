/**
 * @module logger
 * This module simply prepend a timestamp and filename to console.log()
 */

// Import node modules
const moment = require('moment');
const fs = require('fs');
const path = require('path');

// master will be set to TRUE if current git branch name is 'master'
const master = ('master' === fs.readFileSync(path.join(process.cwd(), '.git/HEAD'), { encoding: 'utf8' }).match(/ref: refs\/heads\/([^\n]+)/)[1]);

const verbosity = process.argv.slice(2).includes('--quiet');

module.exports = logger = {
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },

  getCallingDetails: () => {
    const err = new Error();
    const frame = err.stack.split('\n')[3];

    // filename:row
    const filename = path.basename(frame).replace(')', '').split(':').slice(0, 2).join(':');

    // /absolute/path/from/project/file:row:column
    // const filename = frame.trimLeft().split(' ')[2].replace(process.cwd(), '').replace(/\(|\)/g, '');

    return filename;
  },

  success: (data, color = '') => {
    const timestamp = moment().format('MMMDD|HH:mm:ss');
    const iconColor = logger.Colors.Bright + logger.Colors.green;
    console.log(`[${timestamp}][SUCCESS]: [${logger.getCallingDetails()}]:${iconColor}✔ ${logger.Colors.Reset}${color}${data}${logger.Colors.Reset}`);
  },

  info: (data, color = '') => {
    const timestamp = moment().format('MMMDD|HH:mm:ss');
    const iconColor = logger.Colors.Bright + logger.Colors.cyan;
    console.log(`[${timestamp}][INFO]: [${logger.getCallingDetails()}]:${iconColor}i ${logger.Colors.Reset}${color}${data}${logger.Colors.Reset}`);
  },

  debug: (data, color = '') => {
    const timestamp = moment().format('MMMDD|HH:mm:ss');
    const iconColor = logger.Colors.Bright + logger.Colors.yellow;
    (master || verbosity) ? '' :
      console.log(`[${timestamp}][DEBUG]: [${logger.getCallingDetails()}]:${iconColor}! ${logger.Colors.Reset}${color}${data}${logger.Colors.Reset}`);
  },

  warning: (data, color = '') => {
    const timestamp = moment().format('MMMDD|HH:mm:ss');
    const iconColor = logger.Colors.Bright + logger.Colors.yellow;
    console.log(`[${timestamp}][WARNING]: [${logger.getCallingDetails()}]:${iconColor}⚠ ${logger.Colors.Reset}${color}${data}${logger.Colors.Reset}`);
  },

  error: (data, color = '') => {
    const timestamp = moment().format('MMMDD|HH:mm:ss');
    const iconColor = logger.Colors.Bright + logger.Colors.red;
    console.log(`[${timestamp}][ERROR]: [${logger.getCallingDetails()}]:${iconColor}✖ ${logger.Colors.Reset}${color}${data}${logger.Colors.Reset}`);
  },

};
