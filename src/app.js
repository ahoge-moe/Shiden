/**
 * @fileoverview An ExpressJS app that exposes routes.
 */

// Import node modules
const express = require('express');
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));
const processNextJob = require(path.join(process.cwd(), 'src/pipeline.js'));
const CONFIG = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

// Import routes
const hardsubFilePost = require(path.join(process.cwd(), 'src/routes/hardsub/file/post.js'));

// Create ExpressJS app
const app = express();

// Use "express.text()" to parse incoming requests payload as a plain string
// This allows us to handle the "JSON.parse()" on our own and wrap it around a "try..catch" block
// And supress the ugly error message if the payload has incorrect JSON syntax
app.use(express.text({ type: 'application/json' }));

// Define routes
app.use(hardsubFilePost);

app.listen(CONFIG.express.port, async () => {
  try {
    logger.info(`Running on http://localhost:${CONFIG.express.port}/`);

    // If "--clean" flag is passed, remove queue file
    if (process.argv.slice(2).includes('--clean')) queueHandler.wipe();

    // If queue has jobs, start processing right away
    if (!queueHandler.isEmpty()) processNextJob();
  }
  catch (e) {
    logger.error(e);
  }
});
