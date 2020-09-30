/**
 * @module ffprobe
 * This module handles the execution of FFprobe commands
 */

// Import node modules
const path = require('path');
const logger = require('logger');

// Import custom modules
const promisefied = require(path.join(process.cwd(), 'src/utils/promisefied.js'));
const pathHandler = require(path.join(process.cwd(), 'src/utils/pathHandler.js'));

module.exports = FFprobe = {
  /**
   * FFprobe the temp file and return stream info in an array
   * @param {{string}} inputFile - Path to temp file
   * @return {{Promise<Array<Object>>}} - Return the stream info in an array
   */
  getStreams: inputFile => {
    return new Promise(async (resolve, reject) => {
      try {
        const command = `${pathHandler.ffprobeBinary} -print_format json -show_streams -v quiet -i "${inputFile}"`;
        const response = await promisefied.exec(command);
        return resolve(JSON.parse(response).streams);
      }
      catch (e) {
        logger.error(e);
        if (e === 'childProcessKilled') return reject(e);
        return reject(800);
      }
    });
  },

  /**
  * Determines which video flag to use for FFmpeg.prepare()
  * @param {{Array<Object>}} streams - Array of streams from temp file
  * @param {{Object}} shidenJob - Current shidenJob
  * @return {{Promise<string>}} - Returns the video flag to be used in FFmpeg.prepare()
  */
  getVideoFlags: (streams, shidenJob) => {
    return new Promise((resolve, reject) => {
      if (shidenJob.videoIndex) {
        logger.info(`shidenJob has provided video index: ${logger.colors.cyan}${shidenJob.videoIndex}`);
        const videoStream = streams.filter(stream => stream.index == shidenJob.videoIndex)[0];
        if (videoStream && videoStream.codec_type === 'video') {
          return resolve(`-map 0:${shidenJob.videoIndex} -c:v copy`);
        }
        else {
          logger.error(`Stream with index: ${shidenJob.videoIndex} is not a video stream or does not exist.`);
          return reject(801);
        }
      }

      logger.info(`Video index not provided in shidenJob. Using first available video stream.`);
      return resolve(`-map 0:v -c:v copy`);
    });
  },

  /**
   * Determines which audio flag to use for FFmpeg.prepare()
   * @param {{Array<Object>}} streams - Array of streams from temp file
   * @param {{Object}} shidenJob - Current shidenJob
   * @return {{Promise<string>}} - Returns the audio flag to be used in FFmpeg.prepare()
   */
  getAudioFlags: (streams, shidenJob) => {
    return new Promise((resolve, reject) => {
      if (shidenJob.audioIndex) {
        logger.info(`shidenJob has provided audio index: ${logger.colors.cyan}${shidenJob.audioIndex}`);
        const audioStream = streams.filter(stream => stream.index == shidenJob.audioIndex)[0];
        if (audioStream && audioStream.codec_type === 'audio') {
          return resolve(`-map 0:${shidenJob.audioIndex} -acodec aac -ab 320k`);
        }
        else {
          logger.error(`Stream with index: ${shidenJob.audioIndex} is not an audio stream or does not exist.`);
          return reject(802);
        }
      }

      logger.info(`Audio index not provided in shidenJob. Looking for stereo audio stream.`);
      const stereoAudioStream = streams.filter(stream => stream.channels === 2)[0];
      if (stereoAudioStream) {
        logger.info(`Stereo audio stream found.`);
        return resolve(`-map 0:${stereoAudioStream.index} -acodec aac -ab 320k`);
      }
      else {
        logger.info(`Stereo audio stream not found. Using first available audio stream.`);
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
   * Returns info about the subtitle stream provided in shidenJob.
   * Otherwise returns info about first available subtitle stream.
   * @param {{Array<Object>}} streams - Array of streams from temp file
   * @param {{Object}} shidenJob - Current shidenJob
   * @return {{Promise<Object>}} - Returns subtitle stream info
   */
  determineSubStream: (streams, shidenJob) => {
    return new Promise((resolve, reject) => {
      if (shidenJob.subIndex) {
        logger.info(`shidenJob has provided subtitle index: ${logger.colors.cyan}${shidenJob.subIndex}`);
        const jobSpecifiedSubStream = streams.filter(stream => stream.index == shidenJob.subIndex)[0];
        if (jobSpecifiedSubStream && jobSpecifiedSubStream.codec_type === 'subtitle') {
          return resolve(jobSpecifiedSubStream);
        }
        else {
          logger.error(`Stream with index: ${shidenJob.subIndex} is not a subtitle stream or does not exist.`);
          return reject(803);
        }
      }

      logger.info(`Subtitle index not provided in shidenJob. Using first available subtitle stream.`);
      const firstAvailableSubtitleStream = streams.filter(stream => stream.codec_type === 'subtitle')[0];
      return resolve(firstAvailableSubtitleStream);
    });
  },

};
