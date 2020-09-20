// Import node modules
const path = require('path');
const express = require('express');
const router = new express.Router();

// Import custom modules
const configHandler = require(path.join(process.cwd(), 'src/utils/configHandler.js'));
const queueHandler = require(path.join(process.cwd(), 'src/utils/queueHandler.js'));

module.exports = router.get('/queue', (req, res) => {
  // Check for authorization
  if (!configHandler.isAuthorized(req.get('Authorization'))) return res.status(401).send('Not authorized');

  const queue = queueHandler.getEntireQueue();
  return res.status(200).send(queue);
});
