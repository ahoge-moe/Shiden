/**
 * @module pathHandler
 * This module defines the path of some files and folders
 * and provides some functions for parsing paths
 */

// Import node modules
const path = require('path');

module.exports = pathHandler = {
  assetsFolder: path.join(process.cwd(), 'assets'),
  tempFolder: path.join(process.cwd(), 'temp'),
  queueFile: path.join(process.cwd(), 'src/queue.json'),
  rcloneBinary: path.join(process.cwd(), 'bin/rclone'),
  ffmpegBinary: path.join(process.cwd(), 'bin/ffmpeg'),
  ffprobeBinary: path.join(process.cwd(), 'bin/ffprobe'),

  /**
   * Joins two paths and returns it
   * "arg1" could end with ":"
   * "arg2" could start with "/"
   * Determine which case it is and returns the joint path properly parsed
   * @param {{string}} arg1 - First path
   * @param {{string}} arg2 - Second path
   * @return {{string}} - Returns arg1+arg2
   */
  parseRclonePaths: (arg1, arg2) => {
    if (arg1.endsWith(':')) return arg1 += arg2.startsWith('/') ? arg2.slice(1) : arg2;
    else return path.join(arg1, arg2);
  },

};
