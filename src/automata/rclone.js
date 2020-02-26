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
          if (await rclone.fileExists(remoteName, job.inputFile)) {
            logger.success(`Found input file in ${logger.colors.bright}${remoteName}`);
            validSource = remoteName;
            break;
          }
        }

        // If file not found in any source, reject
        if (!validSource) {
          logger.error(`No sources contained the input file, cancelling operation.`);
          return reject(600);
        }

        const jobFile = pathHandler.parseRclonePaths(validSource, job.inputFile);
        const tempFolder = tempHandler.getTempFolderPath();

        logger.info(`Downloading ${logger.colors.bright}${jobFile}`);
        const command = `${pathHandler.rcloneBinary} copy "${jobFile}" "${tempFolder}" ${CONFIG.flags.rclone}`;
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
   * @param {{string}} inputFile - file name to be checked
   * @return {{Promise<boolean>}}
   */
  fileExists: (remoteName, inputFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info(`Checking for file in ${logger.colors.bright}${remoteName}`);

        const fileName = path.basename(inputFile);
        const remoteToCheck = pathHandler.parseRclonePaths(remoteName, inputFile);

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
        const tempFolder = tempHandler.getTempFolderPath();
        const ext = path.extname(job.inputFile);
        const transcodedFile = path.join(tempFolder, path.basename(job.inputFile.replace(ext, '.mp4')));

        for (remoteName of CONFIG.remote.uploadDestination) {
          const destination = pathHandler.parseRclonePaths(remoteName, job.outputFolder);
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

  /**
   * Downloads the subtitle file from remote to temp folder
   * Returns true or false for succeeding in downloading the file
   * @param {{Object}} job
   * @return {{void}}
   */
  downloadSubtitleFile: job => {
    return new Promise(async (resolve, reject) => {
      if (job.subtitleFile) {
        try {
          logger.info('Job has specified subtitle file. Downloading subtitle file...', logger.colors.green);
          let validSource = false;
          for (remoteName of CONFIG.remote.downloadSource) {
            if (await rclone.fileExists(remoteName, job.subtitleFile)) {
              logger.success(`Found subtitle file in ${logger.colors.bright}${remoteName}`);
              validSource = remoteName;
              break;
            }
          }

          // If file not found in any source, reject
          if (!validSource) {
            logger.error(`No sources contained the subtitle file, cancelling operation.`);
            return reject(602);
          }

          const subtitleFile = pathHandler.parseRclonePaths(validSource, job.subtitleFile);
          const tempFolder = tempHandler.getTempFolderPath();

          logger.info(`Downloading ${logger.colors.bright}${subtitleFile}`);
          const command = `${pathHandler.rcloneBinary} copy "${subtitleFile}" "${tempFolder}" ${CONFIG.flags.rclone}`;
          await promisefied.exec(command);

          logger.success(`Download completed`);
          return resolve();
        }
        catch (e) {
          return reject(602);
        }
      }
      else {
        return resolve();
      }
    });
  },

};
