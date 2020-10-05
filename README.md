# About
Shiden (紫電), meaning "purple lightning" in Japanese, is an application for hardsubbing video files. 

# Features
- Connect to and receive *jobs* from an **inbound** message-broker, and then proceed to hardsub.
- If the connection to the inbound message-broker fails to establish or is broken while processing a job, Shiden can be configured to attempt to reconnect in the config file.
- Connect to and send *messages* to an **outbound** message-broker, after hardsubbing is done.
- If the connection to the outbound message-broker fails to establish, a message will be sent to discord webhook(s) instead.
- Video files are downloaded and uploaded using [rclone](https://rclone.org/).
- Video files are hardsubbed using [ffmpeg](https://ffmpeg.org/).
- Subtitles can be text-based or bitmap-based.
- Hardsubbing is unopinionated. Read [Usage](#usage) below.
- Optionally, Shiden can be used in conjuction with [Raikiri](https://github.com/wizo06/Raikiri). This will effectively expose Shiden to HTTP endpoints, and can be used as a microservice through HTTP endpoints instead.

# Requirements
- x86_64 CPU architecture
- Linux
- Node.js
- unzip, tar, curl

# Getting Started

1. Clone repo
```bash
git clone https://github.com/wizo06/Shiden.git
```
2. Download binaries and install Node.js dependencies
```bash
./prepare.sh
```
3. Configure rclone
```bash
bin/rclone config --config conf/rclone.conf
```
4. Edit this file as necessary
```bash
nano conf/user_config.toml
```
5. Start Shiden
```bash
npm start
```

# Usage
Shiden is meant to be unopinionated when hardsubbing files. This means that the first available stream will be chosen if it's not specified in the message from the broker.

Messages from the broker are expected to be in a format such that `JSON.parse(msg)` will return a valid JSON object. 

This JSON object is expected to follow this schema:

Field | Required | Description | Type | Default
--- | --- | --- | --- | --- |
`inputFile` | Yes | Full path to the source video file in the rclone remote | String |
`outputFolder` | Yes | Full path to the destination folder in the rclone remote | String |
`showName` | No | Name of the show used for fetching metadata | String |
`subtitleFile` | No | Full path to a subtitle file | String | Subtitle stream embedded in `inputFile`
`subtitleOffset` | No | Number of seconds to offset the subtitle | Number | 0
`videoIndex` | No | Video stream index that will be used from `inputFile` | Number | First available video stream
`audioIndex` | No | Audio stream index that will be used from `inputFile` | Number | First available audio stream
`subIndex` | No | Subtitle stream index that will be used from `inputFile` (`subtitleFile` instead if provided) | Number | First available subtitle stream
`fontStyle` | No | Font style used for text based hardsub | String | OpenSans-Bold
`fontSize` | No | Font size used for text based hardsub | Number | 36

Available font styles: see `assets/` folder.

# Error codes

| Code | Description |
| --- | --- |
| 600 | Rclone failed to download input file |
| 601 | Rclone failed to upload |
| 602 | Rclone failed to download subtitle file |
| 700 | FFmpeg failed to prepare |
| 701 | FFmpeg failed to change container |
| 702 | FFmpeg failed to extract subtitle file |
| 703 | FFmpeg failed to hardsub with text-based flags |
| 704 | FFmpeg failed to hardsub with bitmap-based flags |
| 705 | FFmpeg failed to offset subtitle file |
| 800 | FFprobe failed to extract stream info from file |
| 801 | FFprobe failed to return video flags |
| 802 | FFprobe failed to return audio flags |
| 803 | FFprobe failed to return info about subtitle stream |
| 804 | FFprobe failed to detect subtitle stream in subtitle file |
| 900 | promisefied.exec() exited with non-0 code |
| 901 | promisefied.request() returned with error |
| 902 | promisefied.jsonParse() failed to parse string because of SyntaxError |
