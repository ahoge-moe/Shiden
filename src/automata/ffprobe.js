/**
 * @module ffprobe
 * This module handles the execution of FFprobe commands
 * and provides functions to determine which stream to use
 */

// Import node modules
const path = require('path');
require('toml-require').install({ toml: require('toml') });

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const logger = require(path.join(process.cwd(), 'src/utils/logger.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

module.exports = FFprobe = {
  /**
   * FFprobe the temp file and return stream info in an array
   * @param {{string}} tempFilePath - Path to temp file
   * @return {{Promise<Array<Object>>}} - Return the stream info in an array
   */
  getStreams: tempFilePath => {
    return new Promise(async (resolve, reject) => {
      try {
        const command = `${pathHandler.ffprobeBinary} -print_format json -show_streams -v quiet -i "${tempFilePath}"`;
        const response = await promisefied.exec(command);
        return resolve(JSON.parse(response).streams);
      }
      catch (e) {
        logger.error(e);
        return reject(800);
      }
    });
  },

  /**
  * Determines which video flag to use for FFmpeg.prepare()
  * @param {{Array<Object>}} streams - Array of streams from temp file
  * @param {{Object}} job - Current job
  * @return {{Promise<string>}} - Returns the video flag to be used in FFmpeg.prepare()
  */
  getVideoFlags: (streams, job) => {
    return new Promise((resolve, reject) => {
      if (job.videoIndex) {
        logger.info(`Payload has specified video index: ${logger.colors.cyan}${job.videoIndex}`);
        const videoStream = streams.filter(stream => stream.index == job.videoIndex)[0];
        if (videoStream && videoStream.codec_type === 'video') {
          return resolve(`-map 0:${job.videoIndex} -c:v copy`);
        }
        else {
          logger.error(`Stream with index: ${job.videoIndex} is not a video stream or does not exist.`);
          return reject(801);
        }
      }

      logger.info(`Video index not specified in job. Using first available video stream.`);
      return resolve(`-map 0:v -c:v copy`);
    });
  },

  /**
   * Determines which audio flag to use for FFmpeg.prepare()
   * @param {{Array<Object>}} streams - Array of streams from temp file
   * @param {{Object}} job - Current job
   * @return {{Promise<string>}} - Returns the audio flag to be used in FFmpeg.prepare()
   */
  getAudioFlags: (streams, job) => {
    return new Promise((resolve, reject) => {
      if (job.audioIndex) {
        logger.info(`Payload has specified audio index: ${logger.colors.cyan}${job.audioIndex}`);
        const audioStream = streams.filter(stream => stream.index == job.audioIndex)[0];
        if (audioStream && audioStream.codec_type === 'audio') {
          return resolve(`-map 0:${job.audioIndex} -acodec aac -ab 320k`);
        }
        else {
          logger.error(`Stream with index: ${job.audioIndex} is not an audio stream or does not exist.`);
          return reject(802);
        }
      }

      logger.info(`Audio index not specified in job. Looking for stereo audio stream.`);
      const stereoAudioStream = streams.filter(stream => stream.channels === 2)[0];
      if (stereoAudioStream) {
        logger.success(`Stereo audio stream found.`);
        return resolve(`-map 0:${stereoAudioStream.index} -acodec aac -ab 320k`);
      }
      else {
        logger.error(`Stereo audio stream not found. Using first available audio strema.`);
        return resolve(`-map 0:a -acodec aac -ab 320k`);
      }
    });
  },

  /**
   * Determines if temp file has subtitle stream or not
   * @param {{Array<Object>}} streams - Array of streams from temp file
   * @return {{boolean}}
   */
  hasSub: streams => {
    const sub = streams.filter(stream => stream.codec_type === 'subtitle')[0];
    if (sub) {
      logger.info(`Subtitle stream detected`);
      return true;
    }
    else {
      logger.info(`Subtitle stream not detected`);
      return false;
    }
  },

  /**
   * Returns info about the subtitle stream specified in job.
   * Otherwise returns info about first available subtitle stream.
   * @param {{Array<Object>}} streams - Array of streams from temp file
   * @param {{Object}} job - Current job
   * @return {{Promise<Object>}} - Returns subtitle stream info
   */
  getSubStreamInfo: (streams, job) => {
    return new Promise((resolve, reject) => {
      if (job.subIndex) {
        logger.info(`Payload has specified subtitle index: ${logger.colors.cyan}${job.subIndex}`);
        const jobSpecifiedSubStream = streams.filter(stream => stream.index == job.subIndex)[0];
        if (jobSpecifiedSubStream && jobSpecifiedSubStream.codec_type === 'subtitle') {
          return resolve(jobSpecifiedSubStream);
        }
        else {
          logger.error(`Stream with index: ${job.subIndex} is not a subtitle stream or does not exist.`);
          return reject(803);
        }
      }

      logger.info(`Subtitle index not specified in job. Using first available subtitle stream.`);
      const firstAvailableSubtitleStream = streams.filter(stream => stream.codec_type === 'subtitle')[0];
      return resolve(firstAvailableSubtitleStream);
    });
  },

  /**
   * Determines if provided subtitle file is video file or not
   * @param {{string}} subtitleFile - Path to subtitle file
   * @return {{boolean}}
   */
  subtitleFileIsVideo: async subtitleFile => {
    const streams = await FFprobe.getStreams(subtitleFile);
    const videoStream = streams.filter(stream => stream.codec_type === 'video')[0];
    if (videoStream) {
      logger.info(`Provided subtitle file is a video file.`);
      return true;
    }
    else {
      logger.info(`Provided subtitle file is not a video file.`);
      return false;
    }
  },

};
