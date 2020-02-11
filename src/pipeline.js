/**
 * @module pipeline
 * This module handles the logic of choosing which FFmpeg command to use
 * for the current job. It uses FFprobe to probe the info of the video file.
 */

// Import node modules
const fs = require('fs');
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const FFprobe = require(path.join(process.cwd(), 'src/automata/ffprobe.js'));
const FFmpeg = require(path.join(process.cwd(), 'src/automata/ffmpeg.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

module.exports = pipeline = {
  x264: job => {
    return new Promise(async (resolve, reject) => {
      try {
        // Declare some variables
        const tempFolderPath = tempHandler.getTempFolderPath();
        const originalFileName = path.basename(job.sourceFile);
        const ext = path.extname(originalFileName);
        const originalFilePath = path.join(tempFolderPath, originalFileName);
        const tempFilePath = path.join(tempFolderPath, `temp${ext}`);
        const tempPreppedFilePath = path.join(tempFolderPath, `temp_prepped${ext}`);
        const assFilePath = path.join(tempFolderPath, `sub.ass`);
        const outputFilePath = path.join(tempFolderPath, originalFileName.replace(ext, '.mp4'));

        // Step 1: Rename file to "temp"
        logger.info(`Renaming ${originalFileName} to ${path.basename(tempFilePath)}`);
        fs.renameSync(originalFilePath, tempFilePath);

        // Step 2: FFprobe to extract info from file
        logger.info(`Probing ${path.basename(tempFilePath)}`);
        const streams = await FFprobe.getStreams(tempFilePath);

        // Step 3: Extract video and audio streams into "temp_prepped"
        logger.info(`Preparing ${path.basename(tempFilePath)}`);
        await FFmpeg.prepare(tempFilePath, tempPreppedFilePath, streams, job);

        if (!FFprobe.hasSub(streams)) {
          // Step 4: If no subtitle stream, simply change container
          logger.info(`Changing container`);
          await FFmpeg.changeContainer(tempPreppedFilePath, outputFilePath);
        }
        else {
          const subStream = await FFprobe.getSubStreamInfo(streams, job);
          logger.info(`Codec name: ${subStream.codec_name}`);

          try {
            // First attempt with text based hardsub
            logger.info(`Trying with text based hardsub`);

            // Step 4.1: Extract subtitle stream into sub.ass
            logger.info(`Extracting subtitle file`);
            await FFmpeg.extractSubFile(tempFilePath, subStream.index, assFilePath);

            // Step 4.2: Hardsub temp_prepped with -vf subtitles=sub.ass
            logger.info(`Hardsubbing with text based subtitle`);
            await FFmpeg.hardsubText(tempPreppedFilePath, assFilePath, pathHandler.assetsFolder, outputFilePath, job);
          }
          catch (e) {
            // If text based hardsub failed, attempt again with bitmap based hardsub
            try {
              logger.error(`Failed with text based hardsub`);
              logger.info(`Trying with bitmap based hardsub`);

              // Step 4.1: Hardsub temp_prepped with -filter_complex overlay
              logger.info(`Hardsubbing with bitmap based subtitle`);
              await FFmpeg.hardsubBitmap(tempPreppedFilePath, tempFilePath, subStream.index, outputFilePath);
            }
            catch (e) {
              // If bitmap based hardsub failed, reject with its error code
              // and let @worker handle it
              logger.error(e);
              return reject(e);
            }
          }
        }

        logger.success(`Hardsubbing completed`);
        return resolve();
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
