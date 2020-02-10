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
const Logger = require(path.join(process.cwd(), 'src/shared/utils/logger.js'));
const Promisefied = require(path.join(process.cwd(), 'src/shared/utils/promisefied.js'));
const Temp = require(path.join(process.cwd(), 'src/shared/utils/temp.js'));
const Paths = require(path.join(process.cwd(), 'src/shared/utils/paths.js'));
const { remote } = require(path.join(process.cwd(), 'src/shared/utils/config.js'));

const REMOTE = (process.argv[2]) ? process.argv[2] : `${remote.plex}Pending`;

(async () => {
  try {
    const tempPath = await Temp.getPlexTempFolderPath();

    let command = `${Paths.rclonePath} lsf "${REMOTE}" --dirs-only -d=false`;
    let response = await Promisefied.exec(command);
    const shows = response.split('\n').slice(0, -1);
    Logger.info(`shows size: ${shows.length}`, Logger.Colors.green);

    // Poster
    command = `${Paths.rclonePath} lsf "${REMOTE}" -R --files-only --include "poster.*"`;
    response = await Promisefied.exec(command);
    let showsWithPoster = response.split('\n').slice(0, -1);
    showsWithPoster = showsWithPoster.map(line => line.split('/')[0]);
    Logger.info(`showsWithPoster size: ${showsWithPoster.length}`, Logger.Colors.green);

    const showsWithoutPoster = shows.filter(show => !showsWithPoster.includes(show));
    Logger.info(`showsWithoutPoster size: ${showsWithoutPoster.length}`, Logger.Colors.green);

    for (anilistName of showsWithoutPoster) {
      try {
        Logger.info(`Processing ${anilistName}`, Logger.Colors.cyan);
        const anilistResponse = await Anilist.query(anilistName);
        const coverImageFileName = `${anilistResponse.coverImage.large.split('/').pop()}`;

        // Download poster to temp folder
        let command = `wget -O ${path.join(tempPath, coverImageFileName)} ${anilistResponse.coverImage.large}`;
        Logger.debug(`Downloading ${anilistResponse.coverImage.large}`);
        await Promisefied.exec(command);

        // Upload poster
        command = `${Paths.rclonePath} copyto "${path.join(tempPath, coverImageFileName)}"`;
        command += ` "${REMOTE}/${anilistName}/poster${path.extname(coverImageFileName)}"`;
        Logger.debug(`Uploading ${coverImageFileName}`);
        await Promisefied.exec(command);

        // Remove poster from temp folder
        Logger.debug(`Removing ${coverImageFileName}`);
        fs.unlinkSync(path.join(tempPath, coverImageFileName));
      }
      catch (e) {
        Logger.error(e);
      }
    }

    // Background
    command = `${Paths.rclonePath} lsf "${REMOTE}" -R --files-only --include "background.*"`;
    response = await Promisefied.exec(command);
    let showsWithBackground = response.split('\n').slice(0, -1);
    showsWithBackground = showsWithBackground.map(line => line.split('/')[0]);
    Logger.info(`showsWithBackground size: ${showsWithBackground.length}`, Logger.Colors.green);

    const showsWithoutBackground = shows.filter(show => !showsWithBackground.includes(show));
    Logger.info(`showsWithoutBackground size: ${showsWithoutBackground.length}`, Logger.Colors.green);

    for (anilistName of showsWithoutBackground) {
      try {
        Logger.info(`Processing ${anilistName}`, Logger.Colors.cyan);
        const anilistResponse = await Anilist.query(anilistName);
        if (anilistResponse.bannerImage) {
          const bannerImageFileName = `${anilistResponse.bannerImage.split('/').pop()}`;

          // Download background to temp folder
          command = `wget -O ${path.join(tempPath, bannerImageFileName)} ${anilistResponse.bannerImage}`;
          Logger.debug(`Downloading ${anilistResponse.bannerImage}`);
          await Promisefied.exec(command);

          // Upload background
          command = `${Paths.rclonePath} copyto "${path.join(tempPath, bannerImageFileName)}"`;
          command += ` "${REMOTE}/${anilistName}/background${path.extname(bannerImageFileName)}"`;
          Logger.debug(`Uploading ${bannerImageFileName}`);
          await Promisefied.exec(command);

          // Remove background from temp folder
          Logger.debug(`Removing ${bannerImageFileName}`);
          fs.unlinkSync(path.join(tempPath, bannerImageFileName));
        }
        else Logger.error(`bannerImage is ${anilistResponse.bannerImage}`);
      }
      catch (e) {
        Logger.error(e);
      }
    }

    // Banner
    command = `${Paths.rclonePath} lsf "${REMOTE}" -R --files-only --include "banner.*"`;
    response = await Promisefied.exec(command);
    let showsWithBanner = response.split('\n').slice(0, -1);
    showsWithBanner = showsWithBanner.map(line => line.split('/')[0]);
    Logger.info(`showsWithBanner size: ${showsWithBanner.length}`, Logger.Colors.green);

    const showsWithoutBanner = shows.filter(show => !showsWithBanner.includes(show));
    Logger.info(`showsWithoutBanner size: ${showsWithoutBanner.length}`, Logger.Colors.green);

    for (anilistName of showsWithoutBanner) {
      try {
        Logger.info(`Processing ${anilistName}`, Logger.Colors.cyan);
        const anilistResponse = await Anilist.query(anilistName);
        if (anilistResponse.bannerImage) {
          const bannerImageFileName = `${anilistResponse.bannerImage.split('/').pop()}`;

          // Download background to temp folder
          command = `wget -O ${path.join(tempPath, bannerImageFileName)} ${anilistResponse.bannerImage}`;
          Logger.debug(`Downloading ${anilistResponse.bannerImage}`);
          await Promisefied.exec(command);

          // Upload background
          command = `${Paths.rclonePath} copyto "${path.join(tempPath, bannerImageFileName)}"`;
          command += ` "${REMOTE}/${anilistName}/banner${path.extname(bannerImageFileName)}"`;
          Logger.debug(`Uploading ${bannerImageFileName}`);
          await Promisefied.exec(command);

          // Remove background from temp folder
          Logger.debug(`Removing ${bannerImageFileName}`);
          fs.unlinkSync(path.join(tempPath, bannerImageFileName));
        }
        else Logger.error(`bannerImage is ${anilistResponse.bannerImage}`);
      }
      catch (e) {
        Logger.error(e);
      }
    }
  }
  catch (e) {
    Logger.error(e);
  }
})();
