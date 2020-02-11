/**
 * @module worker
 * This module handles jobs from the queue
 */

// Import node modules
const path = require('path');

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const rclone = require(path.join(process.cwd(), 'src/automata/rclone.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHanlder.js'));
const pipeline = require(path.join(process.cwd(), 'src/pipeline.js'));

module.exports = processNextJob = async () => {
  try {
    // Step 0 Retrieve next job
    const job = queueHandler.getFirstJob();

    // Step 1 Download
    logger.info('[1/4] Downloading');
    await rclone.download(job);

    // Step 2 Hardsub
    logger.info(['[2/4] Transcoding'])
    await pipeline.x264(job);

    // Step 3 Upload
    await rclone.upload(job);

    // Step 4 Notify
    await notification.send(job);

    // Delete files in folder/
    tempHandler.destroy();

    // Remove current job out of queue
    queueHandler.removeFirstJobFromQueue();

    // Check if queue has jobs and recursively process next job
    if (!queueHandler.isEmpty()) processNextJob();
  }
  catch (e) {
    if (e === 3) logger.error('Download failed');
    if (e === 4) logger.error('Transcode failed');
    if (e === 5) logger.error('Upload failed');

    // Step 4 Notify
    await notification.send(job);

    // Delete files in folder/
    tempHandler.destroy();

    // Remove current job out of queue
    queueHandler.removeFirstJobFromQueue();
  }
};