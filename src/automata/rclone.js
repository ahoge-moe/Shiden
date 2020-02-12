/**
 * @module rclone
 * This module handles the execution of Rclone commands
 */

// Import node modules
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const CONFIG = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

module.exports = rclone = {
  /**
   * Downloads the file from remote to temp folder
   * @param {{Object}} job - Current processing job
   * @return {{void}}
   */
  download: job => {
    return new Promise(async (resolve, reject) => {
      try {
        let validSource = false;
        for (remoteName of CONFIG.remote.downloadSource) {
          if (await rclone.fileExists(remoteName, job.sourceFile)) {
            logger.success(`Found file in ${logger.colors.bright}${remoteName}`);
            validSource = remoteName;
            break;
          }
        }

        // If file not found in any source, reject
        if (!validSource) {
          logger.error(`No sources contained the file, cancelling operation`);
          return reject(600);
        }

        const jobFile = pathHandler.parseRclonePaths(validSource, job.sourceFile);
        const tempFolderPath = tempHandler.getTempFolderPath();

        logger.info(`Downloading ${logger.colors.bright}${jobFile}`);
        const command = `${pathHandler.rcloneBinary} copy "${jobFile}" "${tempFolderPath}" ${CONFIG.flags.rclone}`;
        await promisefied.exec(command);

        logger.success(`Download completed`);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        logger.error(`rclone failed during download`);
        return reject(600);
      }
    });
  },

  /**
   * Check if a file exist in a remote storage
   * @param {{string}} remoteName - remote storage name from rclone config
   * @param {{string}} sourceFile - file name to be checked
   * @return {{boolean}}
   */
  fileExists: (remoteName, sourceFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info(`Checking for file in ${logger.colors.bright}${remoteName}`);

        const fileName = path.basename(sourceFile);
        const remoteToCheck = pathHandler.parseRclonePaths(remoteName, sourceFile);

        const command = `${pathHandler.rcloneBinary} lsf "${remoteToCheck}" --files-only ${CONFIG.flags.rclone.match(/--config \w+\/\w+\.conf/)}`;
        const response = await promisefied.exec(command);

        // If first file in lsf is the same as fileName, then assume file is found
        if (fileName === response.split('\n')[0]) {
          return resolve(true);
        }

        return resolve(false);
      }
      catch (e) {
        logger.error(`File not found in ${logger.colors.bright}${remoteName}`);
        return resolve(false);
      }
    });
  },

  /**
   * Uploads the file from temp folder to remote
   * @param {{Object}} job - Current processing job
   * @return {{void}}
   */
  upload: job => {
    return new Promise(async (resolve, reject) => {
      try {
        const tempFolderPath = tempHandler.getTempFolderPath();
        const ext = path.extname(job.sourceFile);
        const transcodedFile = path.join(tempFolderPath, path.basename(job.sourceFile.replace(ext, '.mp4')));

        for (remoteName of CONFIG.remote.uploadDestination) {
          const destination = pathHandler.parseRclonePaths(remoteName, job.destFolder);
          logger.info(`Uploading to ${logger.colors.bright}${destination}`);

          const command = `${pathHandler.rcloneBinary} copy "${transcodedFile}" "${destination}" ${CONFIG.flags.rclone}`;
          await promisefied.exec(command);
          logger.success(`Upload completed`);
        }
        return resolve();
      }
      catch (e) {
        logger.error(e);
        logger.error(`rclone failed during upload`);
        return reject(601);
      }
    });
  },

};
