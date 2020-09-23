/**
 * @module rclone
 * This module handles the execution of Rclone commands
 */

// Import node modules
const path = require('path');
const logger = require('logger');

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));
const tempHandler = require(path.join(process.cwd(), 'src/utils/tempHandler.js'));
const { loadConfigFile } = require(path.join(process.cwd(), 'src/utils/configHandler.js'));

module.exports = rclone = {
  /**
   * Downloads the file from remote to temp folder
   * @param {{Object}} job - Current processing job
   * @return {{void}}
   */
  downloadInputFile: job => {
    return new Promise(async (resolve, reject) => {
      try {
        let validSource = false;
        for (remoteName of loadConfigFile().rclone.downloadSource) {
          if (await rclone.fileExists(remoteName, job.inputFile)) {
            logger.success(`Found input file in ${remoteName}`);
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

        logger.info(`Downloading ${jobFile}`);
        const command = `${pathHandler.rcloneBinary} copy "${jobFile}" "${tempFolder}" ${loadConfigFile().flags.rclone}`;
        await promisefied.exec(command);

        logger.success(`Download completed`);
        return resolve();
      }
      catch (e) {
        logger.error(e);
        logger.error(`rclone failed during download`);
        if (e === 'childProcessKilled') return reject(e);
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
        logger.info(`Checking for file in ${remoteName}`);

        const fileName = path.basename(inputFile);
        const remoteToCheck = pathHandler.parseRclonePaths(remoteName, inputFile);

        const command = `${pathHandler.rcloneBinary} lsf "${remoteToCheck}" --files-only ${loadConfigFile().flags.rclone.match(/--config \w+\/\w+\.conf/)}`;
        const response = await promisefied.exec(command);

        // If first file in lsf is the same as fileName, then assume file is found
        if (fileName === response.split('\n')[0]) {
          return resolve(true);
        }

        return resolve(false);
      }
      catch (e) {
        logger.warning(`File not found in ${remoteName}`);
        if (e === 'childProcessKilled') return reject(e);
        return resolve(false);
      }
    });
  },

  /**
   * Uploads the file from temp folder to remote
   * @param {{Object}} job - Current processing job
   * @return {{void}}
   */
  upload: (job, outputFileName) => {
    return new Promise(async (resolve, reject) => {
      try {
        const tempFolder = tempHandler.getTempFolderPath();
        const transcodedFile = path.join(tempFolder, outputFileName);

        for (remoteName of loadConfigFile().rclone.uploadDestination) {
          const destination = pathHandler.parseRclonePaths(remoteName, job.outputFolder);
          logger.info(`Uploading to ${destination}`);

          const command = `${pathHandler.rcloneBinary} copy "${transcodedFile}" "${destination}" ${loadConfigFile().flags.rclone}`;
          await promisefied.exec(command);
          logger.success(`Upload completed`);
        }
        return resolve();
      }
      catch (e) {
        logger.error(e);
        logger.error(`rclone failed during upload`);
        if (e === 'childProcessKilled') return reject(e);
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
          for (remoteName of loadConfigFile().rclone.downloadSource) {
            if (await rclone.fileExists(remoteName, job.subtitleFile)) {
              logger.success(`Found subtitle file in ${remoteName}`);
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

          logger.info(`Downloading ${subtitleFile}`);
          const command = `${pathHandler.rcloneBinary} copy "${subtitleFile}" "${tempFolder}" ${loadConfigFile().flags.rclone}`;
          await promisefied.exec(command);

          logger.success(`Download completed`);
          return resolve();
        }
        catch (e) {
          if (e === 'childProcessKilled') return reject(e);
          return reject(602);
        }
      }
      else {
        return resolve();
      }
    });
  },

};
