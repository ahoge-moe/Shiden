/**
 * @fileoverview Rename files of a specific show to start from episode 01
 */
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import helpers
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));

// Import config
const Paths = require(path.join(process.cwd(), 'src/utils/paths.js'));
const { remote } = require(path.join(process.cwd(), 'src/utils/config.js'));

/**
 * @todo
 */
const SHOW = 'Beatless ~ ビートレス [anidb-13500]';

(async () => {
  try {
    const command = `${Paths.rclonePath} lsf "${remote.plex}Premiered/${SHOW}" --files-only --include "*.{mkv,mp4}"`;
    const response = await promisefied.exec(command);
    const files = response.split('\n').slice(0, -1);
    const regex = /\s\d+\s\[[\d\w]+\]\.[\d\w]+/;

    /**
    * To avoid files with same name during renaming process, (therefore replacing files unintentionally)
    * Rename ascendingly or descendingly accordingly
    */
    // If episode counter starts from 00, then rename descendingly
    if (files[0].match(regex)[0].split(' ')[1] == 0) {
      // Rename descendingly
      files.sort((a, b) => b.match(regex)[0].split(' ')[1] - a.match(regex)[0].split(' ')[1]);

      let counter = files.length;
      for (file of files) {
        try {
          let newName;
          if (counter <= 9) newName = file.replace(/\d+\s\[1080p\]\.mkv$/, `0${counter--} [1080p].mkv`);
          else newName = file.replace(/\d+\s\[1080p\]\.mkv$/, `${counter--} [1080p].mkv`);

          await rename(file, newName, SHOW);
        }
        catch (e) {
          logger.error(e);
        }
      }
    }
    // If episode counter starts from 02 or greater, then rename ascendingly
    else {
      // Rename ascendingly
      files.sort((a, b) => a.match(regex)[0].split(' ')[1] - b.match(regex)[0].split(' ')[1]);

      let counter = 1;
      for (file of files) {
        try {
          let newName;
          if (counter <= 9) newName = file.replace(/\d+\s\[1080p\]\.mkv$/, `0${counter++} [1080p].mkv`);
          else newName = file.replace(/\d+\s\[1080p\]\.mkv$/, `${counter++} [1080p].mkv`);

          await rename(file, newName, SHOW);
        }
        catch (e) {
          logger.error(e);
        }
      }
    }
  }
  catch (e) {
    logger.error(e);
  }
})();

const rename = (file, newName, SHOW) => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`${file} => ${newName}`);
      let command = `${Paths.rclonePath} moveto "${remote.plex}Premiered/${SHOW}/${file}"`;
      command += ` "${remote.plex}Premiered/${SHOW}/${newName}" --progress --stats-one-line -v`;
      const response = await promisefied.exec(command);
      logger.info(response);
      resolve();
    }
    catch (e) {
      logger.error(e);
    }
  });
};
