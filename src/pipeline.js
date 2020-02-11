// Import node modules
const path = require('path');

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const rclone = require(path.join(process.cwd(), 'src/automata/rclone.js'));

module.exports = processNextJob = () => {
  // Step 0 Retrieve next job
  const job = queueHandler.getFirstJob();

  // Step 1 Download
  logger.info('[1/4] Downloading');
  rclone.download(job);

  // Step 2 Hardsub
  transcode.x264(job);

  // Step 3 Upload
  rclone.upload(job);

  // Step 4 Notify
  notification.send(job);

  // Check if queue has jobs and recursively process next job
  if (!queueHandler.isEmpty()) processNextJob();
};