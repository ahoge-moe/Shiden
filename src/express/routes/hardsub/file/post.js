// Import node modules
const path = require('path');
const logger = require('logger');
const express = require('express');
const router = new express.Router();

// Import custom modules
const authHandler = require(path.join(process.cwd(), 'src/utils/authHandler.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const payloadHandler = require(path.join(process.cwd(), 'src/utils/payloadHandler.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const processNextJob = require(path.join(process.cwd(), 'src/utils/processor.js'));

module.exports = router.post('/hardsub/file', async (req, res) => {
  try {
    // Check for authorization
    if (!authHandler.isAuthorized(req.get('Authorization'))) return res.status(401).send('Not authorized');

    // Check for content type
    if (req.get('Content-Type') !== 'application/json') return res.status(415).send('Content-Type must be application/json');

    // Check for JSON syntax. If it has wrong syntax, catch() will handle the error
    const payload = await promisefied.jsonParse(req.body);

    // Check for required keys
    const requiredKeys = ['inputFile', 'outputFolder'];
    if (!payloadHandler.payloadHasAllRequiredKeys(payload, requiredKeys)) return res.status(400).send('Missing required key');

    // Check for schema
    const schema = {
      inputFile: 'string',
      outputFolder: 'string',
      showName: 'string',
      subtitleFile: 'string',
      subtitleOffset: 'number',
      videoIndex: 'number',
      audioIndex: 'number',
      subIndex: 'number',
      fontStyle: 'string',
      fontSize: 'number',
    }
    if (!payloadHandler.payloadHasValidSchema(payload, schema)) return res.status(400).send('Invalid schema');

    // Respond with success
    res.status(202).send('Payload accepted');

    logger.success(`*************************`, logger.colors.magenta);
    for ([key, value] of Object.entries(payload)) {
      logger.success(`Loaded ${key}: ${logger.colors.bright}${value}`);
    }
    logger.success(`*************************`, logger.colors.magenta);

    // If queue is empty, push payload onto queue and start processing the job right away
    logger.debug('Checking if queue is empty');
    if (queueHandler.isEmpty()) {
      queueHandler.push(payload);
      processNextJob();
    }
    // else, simply push payload onto queue
    else {
      queueHandler.push(payload);
    }
  }
  catch (errorCode) {
    if (errorCode === 902) return res.status(400).send(`${errorCode}`);
    return logger.error('Unknown error');
  }
});
