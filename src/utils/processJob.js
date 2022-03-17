/**
 * @module processJob
 * This module handles processing jobs 
 */

// Import node modules
const path = require('path');
const logger = require('@wizo06/logger');

// Import custom modules
const rclone = require(path.join(process.cwd(), 'src/automata/rclone.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const encode = require(path.join(process.cwd(), 'src/utils/encode.js'));
const notification = require(path.join(process.cwd(), 'src/utils/notification.js'));

module.exports = processJob = (shidenJob, originalMessage) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Delete files in folder/
      tempHandler.destroy();
      
      // Step 1 Download
      logger.info('[1/4] Downloading...', logger.colors.yellow);
      await rclone.downloadInputFile(shidenJob);
  
      // Download subtitle file if job has specified it
      await rclone.downloadSubtitleFile(shidenJob);
  
      // Step 2 Encode
      logger.info('[2/4] Encoding...', logger.colors.yellow)
      const outputFileName = await encode.x264(shidenJob);
  
      // Step 3 Upload
      logger.info('[3/4] Uploading...', logger.colors.yellow);
      await rclone.upload(shidenJob, outputFileName);
  
      // Step 4 Send message to broker
      logger.info('[4/4] Sending message to outbound broker...', logger.colors.yellow);
      await notification.sendToBroker(shidenJob, outputFileName, originalMessage);
  
      // Delete files in folder/
      tempHandler.destroy();
      resolve();
    }
    catch (errorCode) {
      // Log the error code from step 1, 2 , 3 and/or 4
      logger.error(errorCode);

      // Delete files in folder/
      tempHandler.destroy();

      reject(errorCode);
    }
  });
};