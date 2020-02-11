/**
 * @module ffmpeg
 * This module handles the execution of FFmpeg commands
 */

// Import node modules
const path = require('path');
const fs = require('fs');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const FFprobe = require(path.join(process.cwd(), 'src/automata/ffprobe.js'));
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

// master will be set to TRUE if current git branch name is 'master'
const master = ('master' === fs.readFileSync(path.join(process.cwd(), '.git/HEAD'), { encoding: 'utf8' }).match(/ref: refs\/heads\/([^\n]+)/)[1]);

module.exports = FFmpeg = {
  /**
   * Extract video and audio streams into temp_prepped
   * @param {{string}} tempFilePath - Path to temp file
   * @param {{string}} tempPreppedFilePath - Path to temp_prepped file
   * @param {{Array}} streams - Array of streams from temp file, extracted with FFprobe
   * @param {{Object}} job - Current job
   * @return {{void}}
   */
  prepare: (tempFilePath, tempPreppedFilePath, streams, job) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${tempFilePath}"`];
        command.push(await FFprobe.getVideoFlags(streams, job));
        command.push(await FFprobe.getAudioFlags(streams, job));
        command.push(master ? '' : '-t 300');
        command.push(`"${tempPreppedFilePath}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        logger.success(`File has been prepared in ${path.basename(tempPreppedFilePath)}`);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        // If error was thrown from FFprobe, reject with their error code
        // and let @worker handle it
        if (e === 801) return reject(e);
        if (e === 802) return reject(e);

        // If error was thrown from running this function
        // Reject with 700
        return reject(700);
      }
    });
  },

  /**
   * Change container of file into without transcoding
   * @param {{string}} tempPreppedFilePath - Path to temp_prepped file
   * @param {{string}} outputFilePath - Path to output file
   * @return {{void}}
   */
  changeContainer: (tempPreppedFilePath, outputFilePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${tempPreppedFilePath}"`];
        command.push(`-c copy`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFilePath}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        return reject(701);
      }
    });
  },

  /**
   * Extract subtitle stream from temp file into an ass file
   * @param {{string}} tempFilePath - Path to temp file
   * @param {{number}} index - Index of the subtitle stream
   * @param {{string}} assFilePath - Path to ass file
   * @return {{void}}
   */
  extractSubFile: (tempFilePath, index, assFilePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${tempFilePath}"`];
        command.push(`-map 0:${index}`);
        command.push(`"${assFilePath}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        return reject(702);
      }
    });
  },

  /**
   * Hardsub tempPreppedFilePath with assFile while forcing fontstyle inside assetsFolder
   * @param {{string}} tempPreppedFilePath - Path to temp_prepped file
   * @param {{string}} assFilePath - Path to ass file
   * @param {{string}} assetsFolder - Path to assets folder
   * @param {{string}} outputFilePath - Path to output file
   * @param {{Object}} job - Incoming payload in JSON format
   * @return {{void}}
   */
  hardsubText: (tempPreppedFilePath, assFilePath, assetsFolder, outputFilePath, job) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Defaults to NotoSansJP-Medium fontstyle if not provided in payload
        const fontName = (job.fontStyle) ? job.fontStyle : 'NotoSansJP-Medium';

        let command = [`${pathHandler.ffmpegBinary} -i "${tempPreppedFilePath}"`];
        command.push(`-vf subtitles=${assFilePath}:force_style='FontName=${fontName}:fontsdir=${assetsFolder}'`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFilePath}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        return reject(703);
      }
    });
  },

  /**
   * Hardsub tempPreppedFile with bitmap based subtitle stream
   * @param {{string}} tempPreppedFilePath - Path to temp_prepped file
   * @param {{string}} tempFilePath - Path to temp file
   * @param {{number}} index - Index of the subtitle stream
   * @param {{string}} outputFilePath - Path to output file
   * @return {{void}}
   */
  hardsubBitmap: (tempPreppedFilePath, tempFilePath, index, outputFilePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${tempPreppedFilePath}" -i "${tempFilePath}"`];
        command.push(`-filter_complex "[0:v][1:${index}]overlay[v]"`);
        command.push(`-map "[v]"`);
        command.push(`-map 0:a -acodec aac -ab 320k`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFilePath}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        return reject(704);
      }
    });
  },
};
