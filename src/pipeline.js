module.exports = processNextJob = () => {
  // Step 1 Download
  // Step 2 Hardsub
  // Step 3 Upload
  // Step 4 Notify

  // Check if queue has jobs and recursively process next job
  if (!(await queueHandler.isEmpty())) processNextJob();
};