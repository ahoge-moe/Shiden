// Import node modules
const path = require('path');

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));

module.exports = processNextJob = () => {
  // Step 1 Download
  // Step 2 Hardsub
  // Step 3 Upload
  // Step 4 Notify

  // Check if queue has jobs and recursively process next job
  if (!queueHandler.isEmpty()) processNextJob();
};