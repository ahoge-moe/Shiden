/**
 * @module encode
 * This module handles the logic flow of choosing which
 * FFmpeg command to use for the current job.
 */

// Import node modules
const fs = require('fs');
const path = require('path');
const logger = require('logger');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const FFprobe = require(path.join(process.cwd(), 'src/automata/ffprobe.js'));
const FFmpeg = require(path.join(process.cwd(), 'src/automata/ffmpeg.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

module.exports = encode = {
  x264: job => {
    return new Promise(async (resolve, reject) => {
      try {
        // Declare some variables
        const tempFolder = tempHandler.getTempFolderPath();

        const inputFileName = path.basename(job.inputFile);
        const inputFile = path.join(tempFolder, inputFileName);

        const ext = path.extname(inputFileName);
        const tempInputFile = path.join(tempFolder, `temp_input${ext}`);
        const preppedInputFile = path.join(tempFolder, `prepped_input${ext}`);
        const assFile = path.join(tempFolder, `sub.ass`);
        const outputFile = path.join(tempFolder, inputFileName.replace(ext, '.mp4'));
        const outputFileName = path.basename(outputFile);

        // Step 1: Rename input file
        logger.info(`Renaming ${inputFileName} to ${path.basename(tempInputFile)}`);
        fs.renameSync(inputFile, tempInputFile);

        // Step 2: Extract streams info from input file
        logger.info(`Probing ${path.basename(tempInputFile)}`);
        const inputFileStreams = await FFprobe.getStreams(tempInputFile);

        // Step 3: Prepare a file that only has 1 video stream and 1 audio stream
        logger.info(`Extracting video and audio stream into ${path.basename(preppedInputFile)}`);
        await FFmpeg.prepare(tempInputFile, preppedInputFile, inputFileStreams, job);

        // If job has specified subtitle file
        if (job.subtitleFile) {
          const subtitleFileName = path.basename(job.subtitleFile);
          const subtitleFile = path.join(tempFolder, subtitleFileName);
          const subFileExt = path.extname(subtitleFileName);
          const tempSubFile = path.join(tempFolder, `temp_sub${subFileExt}`);
          
          logger.info(`Subtitle file provided: ${subtitleFileName}`);

          // Rename subtitle file
          logger.info(`Renaming ${subtitleFileName} to ${path.basename(tempSubFile)}`);
          fs.renameSync(subtitleFile, tempSubFile);

          // Extract streams info from subtitle file
          logger.info(`Probing ${path.basename(tempSubFile)}`);
          const subtitleFileStreams = await FFprobe.getStreams(tempSubFile);

          if (!FFprobe.hasSub(subtitleFileStreams)) {
            logger.error(`Subtitle file has no subtitle stream`);
            return reject(804);
          }

          // Determine which sub stream to use
          const subStream = await FFprobe.determineSubStream(subtitleFileStreams, job);

          try {
            // First attempt with text based hardsub
            logger.info(`Trying with text based hardsub`);

            // Extract subtitle stream
            logger.info(`Extracting subtitle file`);
            await FFmpeg.extractSubFile(tempSubFile, subStream.index, assFile);

            // Hardsub with text based
            logger.info(`Hardsubbing with text based subtitle`);
            await FFmpeg.hardsubText(preppedInputFile, assFile, pathHandler.assetsFolder, outputFile, job);

            logger.success(`Hardsubbing completed`);
            return resolve(outputFileName);
          }
          catch (e) {
            // If text based hardsub failed, attempt again with bitmap based hardsub
            try {
              logger.error(`Failed with text based hardsub`);
              logger.info(`Trying with bitmap based hardsub`);

              logger.info(`Hardsubbing with bitmap based subtitle`);
              await FFmpeg.hardsubBitmap(preppedInputFile, tempSubFile, subStream.index, outputFile, job);

              logger.success(`Hardsubbing completed`);
              return resolve(outputFileName);
            }
            catch (e) {
              // If bitmap based hardsub failed, reject with its error code
              // and let @worker handle it
              logger.error(e);
              return reject(e);
            }
          }
        }

        logger.info(`Subtitle file not provided in job. Probing ${path.basename(tempInputFile)}`);
        // If job did not specify subtitle file
        if (!FFprobe.hasSub(inputFileStreams)) {
          // Step 4: If no subtitle stream, simply change container
          logger.info(`Changing container`);
          await FFmpeg.changeContainer(preppedInputFile, outputFile);

          logger.success(`Hardsubbing completed`);
          return resolve(outputFileName);
        }
        else {
          const subStream = await FFprobe.determineSubStream(inputFileStreams, job);
          logger.debug(`Codec name: ${subStream.codec_name}`);

          try {
            // First attempt with text based hardsub
            logger.info(`Trying with text based hardsub`);

            // Step 4.1: Extract subtitle stream into sub.ass
            logger.info(`Extracting subtitle stream into ${path.basename(assFile)}`);
            await FFmpeg.extractSubFile(tempInputFile, subStream.index, assFile);

            // Step 4.2: Hardsub temp_prepped with -vf subtitles=sub.ass
            logger.info(`Hardsubbing with text based subtitle`);
            await FFmpeg.hardsubText(preppedInputFile, assFile, pathHandler.assetsFolder, outputFile, job);

            logger.success(`Hardsubbing completed`);
            return resolve(outputFileName);
          }
          catch (e) {
            // If text based hardsub failed, attempt again with bitmap based hardsub
            try {
              logger.error(`Failed with text based hardsub`);
              logger.info(`Trying with bitmap based hardsub`);

              // Step 4.1: Hardsub temp_prepped with -filter_complex overlay
              logger.info(`Hardsubbing with bitmap based subtitle`);
              await FFmpeg.hardsubBitmap(preppedInputFile, tempInputFile, subStream.index, outputFile, job);

              logger.success(`Hardsubbing completed`);
              return resolve(outputFileName);
            }
            catch (e) {
              // If bitmap based hardsub failed, reject with its error code
              // and let @worker handle it
              logger.error(e);
              return reject(e);
            }
          }
        }
      }
      catch (e) {
        // Reject with the error code from FFmpeg or FFprobe
        // and let @worker handle it
        logger.error(e);
        return reject(e);
      }
    });
  },
};
