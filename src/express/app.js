/**
 * @module app
 * This module is an Express app that exposes routes 
 * and push incoming payloads onto the queue
 */

// Import node modules
const express = require('express');
const path = require('path');
const logger = require('logger');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const processNextJob = require(path.join(process.cwd(), 'src/utils/processor.js'));
const configHandler = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

// Import routes
const hardsubFilePost = require(path.join(process.cwd(), 'src/express/routes/hardsub/file/post.js'));
const queueGet = require(path.join(process.cwd(), 'src/express/routes/queue/get.js'));

// Create ExpressJS app
const app = express();

// Use "express.text()" to parse incoming requests payload as a plain string
// This allows us to handle the "JSON.parse()" on our own and wrap it around a "try..catch" block
// And supress the ugly error message if the payload has incorrect JSON syntax
app.use(express.text({ type: 'application/json' }));

// Define routes
app.use(hardsubFilePost);
app.use(queueGet);

app.listen(configHandler.loadConfigFile().express.port, () => {
  try {
    logger.info(`Running on http://localhost:${configHandler.loadConfigFile().express.port}/`, logger.colors.underscore + logger.colors.green);

    // If "--clean" flag is passed, remove queue file
    if (process.argv.slice(2).includes('--clean')) queueHandler.wipe();

    // Delete files in folder/
    tempHandler.destroy();

    // If queue has jobs, start processing right away
    logger.debug('Checking if queue is empty');
    if (!queueHandler.isEmpty()) processNextJob();
  }
  catch (e) {
    logger.error(e);
  }
});
