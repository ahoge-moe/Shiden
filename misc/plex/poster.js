/**
 * @fileoverview Downloads the coverImage.extraLarge of a particular show from Anilist
 * and saves it as poster.*
 * This is useful for Plex's metadata Agent "Local Media Assets".
 */

// Import node modules
const fs = require('fs');
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const Anilist = require(path.join(process.cwd(), 'src/shared/automata/anilist.js'));

// Import utils
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const Temp = require(path.join(process.cwd(), 'src/utils/temp.js'));
const Paths = require(path.join(process.cwd(), 'src/utils/paths.js'));
const { remote } = require(path.join(process.cwd(), 'src/utils/config.js'));

const REMOTE = (process.argv[2]) ? process.argv[2] : `${remote.plex}Pending`;

(async () => {
  try {
    const tempPath = await Temp.getPlexTempFolderPath();

    let command = `${Paths.rclonePath} lsf "${REMOTE}" --dirs-only -d=false`;
    let response = await promisefied.exec(command);
    const shows = response.split('\n').slice(0, -1);
    logger.info(`shows size: ${shows.length}`, logger.Colors.green);

    // Poster
    command = `${Paths.rclonePath} lsf "${REMOTE}" -R --files-only --include "poster.*"`;
    response = await promisefied.exec(command);
    let showsWithPoster = response.split('\n').slice(0, -1);
    showsWithPoster = showsWithPoster.map(line => line.split('/')[0]);
    logger.info(`showsWithPoster size: ${showsWithPoster.length}`, logger.Colors.green);

    const showsWithoutPoster = shows.filter(show => !showsWithPoster.includes(show));
    logger.info(`showsWithoutPoster size: ${showsWithoutPoster.length}`, logger.Colors.green);

    for (anilistName of showsWithoutPoster) {
      try {
        logger.info(`Processing ${anilistName}`, logger.Colors.cyan);
        const anilistResponse = await Anilist.query(anilistName);
        const coverImageFileName = `${anilistResponse.coverImage.large.split('/').pop()}`;

        // Download poster to temp folder
        let command = `wget -O ${path.join(tempPath, coverImageFileName)} ${anilistResponse.coverImage.large}`;
        logger.debug(`Downloading ${anilistResponse.coverImage.large}`);
        await promisefied.exec(command);

        // Upload poster
        command = `${Paths.rclonePath} copyto "${path.join(tempPath, coverImageFileName)}"`;
        command += ` "${REMOTE}/${anilistName}/poster${path.extname(coverImageFileName)}"`;
        logger.debug(`Uploading ${coverImageFileName}`);
        await promisefied.exec(command);

        // Remove poster from temp folder
        logger.debug(`Removing ${coverImageFileName}`);
        fs.unlinkSync(path.join(tempPath, coverImageFileName));
      }
      catch (e) {
        logger.error(e);
      }
    }

    // Background
    command = `${Paths.rclonePath} lsf "${REMOTE}" -R --files-only --include "background.*"`;
    response = await promisefied.exec(command);
    let showsWithBackground = response.split('\n').slice(0, -1);
    showsWithBackground = showsWithBackground.map(line => line.split('/')[0]);
    logger.info(`showsWithBackground size: ${showsWithBackground.length}`, logger.Colors.green);

    const showsWithoutBackground = shows.filter(show => !showsWithBackground.includes(show));
    logger.info(`showsWithoutBackground size: ${showsWithoutBackground.length}`, logger.Colors.green);

    for (anilistName of showsWithoutBackground) {
      try {
        logger.info(`Processing ${anilistName}`, logger.Colors.cyan);
        const anilistResponse = await Anilist.query(anilistName);
        if (anilistResponse.bannerImage) {
          const bannerImageFileName = `${anilistResponse.bannerImage.split('/').pop()}`;

          // Download background to temp folder
          command = `wget -O ${path.join(tempPath, bannerImageFileName)} ${anilistResponse.bannerImage}`;
          logger.debug(`Downloading ${anilistResponse.bannerImage}`);
          await promisefied.exec(command);

          // Upload background
          command = `${Paths.rclonePath} copyto "${path.join(tempPath, bannerImageFileName)}"`;
          command += ` "${REMOTE}/${anilistName}/background${path.extname(bannerImageFileName)}"`;
          logger.debug(`Uploading ${bannerImageFileName}`);
          await promisefied.exec(command);

          // Remove background from temp folder
          logger.debug(`Removing ${bannerImageFileName}`);
          fs.unlinkSync(path.join(tempPath, bannerImageFileName));
        }
        else logger.error(`bannerImage is ${anilistResponse.bannerImage}`);
      }
      catch (e) {
        logger.error(e);
      }
    }

    // Banner
    command = `${Paths.rclonePath} lsf "${REMOTE}" -R --files-only --include "banner.*"`;
    response = await promisefied.exec(command);
    let showsWithBanner = response.split('\n').slice(0, -1);
    showsWithBanner = showsWithBanner.map(line => line.split('/')[0]);
    logger.info(`showsWithBanner size: ${showsWithBanner.length}`, logger.Colors.green);

    const showsWithoutBanner = shows.filter(show => !showsWithBanner.includes(show));
    logger.info(`showsWithoutBanner size: ${showsWithoutBanner.length}`, logger.Colors.green);

    for (anilistName of showsWithoutBanner) {
      try {
        logger.info(`Processing ${anilistName}`, logger.Colors.cyan);
        const anilistResponse = await Anilist.query(anilistName);
        if (anilistResponse.bannerImage) {
          const bannerImageFileName = `${anilistResponse.bannerImage.split('/').pop()}`;

          // Download background to temp folder
          command = `wget -O ${path.join(tempPath, bannerImageFileName)} ${anilistResponse.bannerImage}`;
          logger.debug(`Downloading ${anilistResponse.bannerImage}`);
          await promisefied.exec(command);

          // Upload background
          command = `${Paths.rclonePath} copyto "${path.join(tempPath, bannerImageFileName)}"`;
          command += ` "${REMOTE}/${anilistName}/banner${path.extname(bannerImageFileName)}"`;
          logger.debug(`Uploading ${bannerImageFileName}`);
          await promisefied.exec(command);

          // Remove background from temp folder
          logger.debug(`Removing ${bannerImageFileName}`);
          fs.unlinkSync(path.join(tempPath, bannerImageFileName));
        }
        else logger.error(`bannerImage is ${anilistResponse.bannerImage}`);
      }
      catch (e) {
        logger.error(e);
      }
    }
  }
  catch (e) {
    logger.error(e);
  }
})();
