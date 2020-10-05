/**
 * @module ffmpeg
 * This module handles the execution of FFmpeg commands
 */

// Import node modules
const path = require('path');
const fs = require('fs');
const logger = require('logger');

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const FFprobe = require(path.join(process.cwd(), 'src/automata/ffprobe.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

// master will be set to TRUE if current git branch name is 'master'
const master = ('master' === fs.readFileSync(path.join(process.cwd(), '.git/HEAD'), { encoding: 'utf8' }).match(/ref: refs\/heads\/([^\n]+)/)[1]);

module.exports = FFmpeg = {
  /**
   * Extract video and audio streams into temp_prepped
   * @param {{string}} inputFile - Path to input file
   * @param {{string}} outputFile - Path to output file
   * @param {{Array<Object>}} streams - Array of streams from temp file, extracted with FFprobe
   * @param {{Object}} shidenJob - Current shidenJob
   * @return {{void}}
   */
  prepare: (inputFile, outputFile, streams, shidenJob) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${inputFile}"`];
        command.push(await FFprobe.getVideoFlags(streams, shidenJob));
        command.push(await FFprobe.getAudioFlags(streams, shidenJob));
        command.push(master ? '' : '-t 60');
        command.push(`"${outputFile}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        // If error was thrown from FFprobe, reject with their error code
        // and let @encode handle it
        if (e === 801 || 802) return reject(e);
        if (e === 'childProcessKilled') return reject(e);
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
        command.push(master ? '' : '-t 60');
        command.push(`"${outputFile}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        if (e === 'childProcessKilled') return reject(e);
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
        if (e === 'childProcessKilled') return reject(e);
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
   * @param {{Object}} shidenJob - Current shidenJob
   * @return {{void}}
   */
  hardsubText: (inputFile, subtitleFile, assetsFolder, outputFile, shidenJob) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Defaults to OpenSans-Bold fontstyle if not provided in shidenJob
        const fontName = (shidenJob.fontStyle) ? shidenJob.fontStyle : 'OpenSans-Bold';
        const fontSize = (shidenJob.fontSize) ? shidenJob.fontSize : 36;

        // If shidenJob specified subtitle offset
        if (shidenJob.subtitleOffset) {
          logger.info(`shidenJob has provided offset number: ${logger.colors.cyan}${shidenJob.subtitleOffset}`);
          const subFileExt = path.extname(subtitleFile);

          let command = [`${pathHandler.ffmpegBinary} -itsoffset ${shidenJob.subtitleOffset} -i "${subtitleFile}"`];
          command.push(`-c copy`);
          command.push(`"offset${subFileExt}"`);
          command = command.join(' ');
          await promisefied.exec(command);

          // Rename subtitle file
          logger.info(`Renaming offset${subFileExt} to ${path.basename(subtitleFile)}`);
          fs.renameSync(`offset${subFileExt}`, subtitleFile);
        }

        let command = [`${pathHandler.ffmpegBinary} -i "${inputFile}"`];
        command.push(`-vf "subtitles=${subtitleFile}:force_style='FontName=${fontName},Fontsize=${fontSize}:fontsdir=${assetsFolder}'"`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 60');
        command.push(`"${outputFile}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        if (e === 'childProcessKilled') return reject(e);
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
  hardsubBitmap: (inputFileOne, inputFileTwo, index, outputFile, shidenJob) => {
    return new Promise(async (resolve, reject) => {
      try {
        let command = [`${pathHandler.ffmpegBinary} -i "${inputFileOne}" -itsoffset ${shidenJob.subtitleOffset ? shidenJob.subtitleOffset : 0} -i "${inputFileTwo}"`];
        command.push(`-filter_complex "[0:v][1:${index}]overlay[v]"`);
        command.push(`-map "[v]"`);
        command.push(`-map 0:a -acodec aac -ab 320k`);
        command.push(`-strict -2 -y`);
        command.push(master ? '' : '-t 60');
        command.push(`"${outputFile}"`);
        command = command.join(' ');
        await promisefied.exec(command);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        if (e === 'childProcessKilled') return reject(e);
        return reject(704);
      }
    });
  },
};
