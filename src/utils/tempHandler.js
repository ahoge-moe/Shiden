/**
 * @module tempHandler
 * This module handles the "temp" folder
 */

// Import node modules
const fs = require('fs');
const path = require('path');

// Import custom modules
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

module.exports = tempHandler = {
  /**
   * Returns the path to "temp" folder but first creates it if it does not exist
   * @return {{string}} - Returns the absolute path to the "temp" folder
   */
  getTempFolderPath: () => {
    if (!fs.existsSync(pathHandler.tempFolder)) {
      logger.debug(`Creating temp/`);
      fs.mkdirSync(pathHandler.tempFolder, { recursive: true });
    }
    return pathHandler.tempFolder;
  },

  /**
   * Delete all files in "temp" folder with fs.unlinkSync()
   * @return {{void}}
   */
  destroy: () => {
    logger.debug(`Emptying temp/`);
    const tempFolderPath = tempHandler.getTempFolderPath();
    const files = fs.readdirSync(tempFolderPath);
    for (file of files) {
      fs.unlinkSync(path.join(tempFolderPath, file));
    }
    return;
  },
};
