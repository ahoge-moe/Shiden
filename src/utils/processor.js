/**
 * @module worker
 * This module handles processing jobs from the queue
 */

// Import node modules
const path = require('path');
const logger = require('logger');

// Import custom modules
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const rclone = require(path.join(process.cwd(), 'src/automata/rclone.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const encode = require(path.join(process.cwd(), 'src/utils/encode.js'));
const notification = require(path.join(process.cwd(), 'src/utils/notification.js'));

module.exports = processNextJob = () => {
  return new Promise(async (resolve, reject) => {
    logger.info(`=== Processing next job`, logger.colors.bright + logger.colors.green);
  
    // Step 0 Retrieve next job
    const job = queueHandler.getFirstJob();
  
    try {
      // Step 1 Download
      logger.info('[1/4] Downloading input file...', logger.colors.yellow);
      await rclone.downloadInputFile(job);
  
      // Download subtitle file if job has specified it
      await rclone.downloadSubtitleFile(job);
  
      // Step 2 Hardsub
      logger.info('[2/4] Executing encode...', logger.colors.yellow)
      const outputFileName = await encode.x264(job);
  
      // Step 3 Upload
      logger.info('[3/4] Uploading...', logger.colors.yellow);
      await rclone.upload(job, outputFileName);
  
      // Step 4 Notify
      logger.info('[4/4] Notifying...', logger.colors.yellow);
      await notification.send(job, outputFileName, undefined);
  
      // Delete files in folder/
      tempHandler.destroy();
  
      // Remove current job out of queue
      queueHandler.removeFirstJobFromQueue();
  
      // Check if queue has jobs and recursively process next job
      logger.debug('Checking if queue is empty');
      if (!queueHandler.isEmpty()) processNextJob();
      resolve();
    }
    catch (errorCode) {
      // Log the error code from step 1, 2 and/or 3
      logger.error(errorCode);
  
      // Step 4 Notify
      logger.info('[4/4] Notifying...', logger.colors.yellow);
      await notification.send(job, undefined, errorCode);
  
      // Delete files in folder/
      tempHandler.destroy();
  
      // Remove current job out of queue
      queueHandler.removeFirstJobFromQueue();
  
      // Check if queue has jobs and recursively process next job
      logger.debug('Checking if queue is empty');
      if (!queueHandler.isEmpty()) processNextJob();
      resolve(); // TODO
    }
  });
};