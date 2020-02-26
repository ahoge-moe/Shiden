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
   * @param {{string}} inputFile - Path to input file
   * @param {{string}} outputFile - Path to output file
   * @param {{Array<Object>}} streams - Array of streams from temp file, extracted with FFprobe
   * @param {{Object}} job - Current job
   * @return {{void}}
   */
  prepare: (inputFile, outputFile, streams, job) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${inputFile}"`];
        command.push(await FFprobe.getVideoFlags(streams, job));
        command.push(await FFprobe.getAudioFlags(streams, job));
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFile}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        logger.success(`File has been prepared in ${logger.colors.bright}${path.basename(outputFile)}`);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        // If error was thrown from FFprobe, reject with their error code
        // and let @worker handle it
        if (errorCode === 801) return reject(e);
        if (errorCode === 802) return reject(e);

        // If error was thrown from running this function
        // Reject with 700
        return reject(700);
      }
    });
  },

  /**
   * Change container of file into without transcoding
   * @param {{string}} inputFile - Path to input file
   * @param {{string}} outputFile - Path to output file
   * @return {{void}}
   */
  changeContainer: (inputFile, outputFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${inputFile}"`];
        command.push(`-c copy`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFile}"`);
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
   * @param {{string}} inputFile - Path to input file
   * @param {{number}} index - Index of the subtitle stream
   * @param {{string}} outputFile - Path to output file
   * @return {{void}}
   */
  extractSubFile: (inputFile, index, outputFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${inputFile}"`];
        command.push(`-map 0:${index}`);
        command.push(`"${outputFile}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.debug(e);
        return reject(702);
      }
    });
  },

  /**
   * Hardsub preppedInputFile with assFile while forcing fontstyle inside assetsFolder
   * @param {{string}} inputFile - Path to input file
   * @param {{string}} subtitleFile - Path to subtitle file
   * @param {{string}} assetsFolder - Path to assets folder
   * @param {{string}} outputFile - Path to output file
   * @param {{Object}} job - Current job
   * @return {{void}}
   */
  hardsubText: (inputFile, subtitleFile, assetsFolder, outputFile, job) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Defaults to NotoSansJP-Medium fontstyle if not provided in job
        const fontName = (job.fontStyle) ? job.fontStyle : 'NotoSansJP-Medium';
        const fontSize = (job.fontSize) ? job.fontSize : 36;

        let command = [`${pathHandler.ffmpegBinary} -i "${inputFile}"`];
        command.push(`-vf "subtitles=${subtitleFile}:force_style='FontName=${fontName},Fontsize=${fontSize}:fontsdir=${assetsFolder}'"`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFile}"`);
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
   * Hardsub preppedInputFile with bitmap based subtitle stream
   * @param {{string}} inputFileOne - Path to first input file
   * @param {{string}} inputFileTwo - Path to second input file
   * @param {{number}} index - Index of the subtitle stream
   * @param {{string}} outputFile - Path to output file
   * @return {{void}}
   */
  hardsubBitmap: (inputFileOne, inputFileTwo, index, outputFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${inputFileOne}" -i "${inputFileTwo}"`];
        command.push(`-filter_complex "[0:v][1:${index}]overlay[v]"`);
        command.push(`-map "[v]"`);
        command.push(`-map 0:a -acodec aac -ab 320k`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 300');
        command.push(`"${outputFile}"`);
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
