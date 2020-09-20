# About
Shiden (紫電), meaning "purple lightning" in Japanese, is an application for hardsubbing video files.

# Features
- Can be used as a web server to receive jobs via HTTP endpoints
- Can be used as a *worker* that connects to a message broker

# Requirements
- x86_64 CPU architecture
- Ubuntu
- Node.js
- npm (comes with Node.js)

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
4. Edit this file
```bash
nano conf/user_config.toml
```
5. Run as web server (option 1)
```bash
npm run web
```
5. Run as worker(option 2)
```bash
npm run worker
```

# Endpoints

## `/hardsub/file`

### POST
  - Description: creates a job for one file
  - Headers:
    - `Authorization: key_1`
    - `Content-Type: application/json`
  - Body:
   ```json
  {
      "inputFile": "TODO/FILE NAME.MKV",
      "outputFolder": "DONE",
  }
  ```
  **NOte**: Shiden still expects these fields even when running as a *worker* of a message broker.

Field | Required | Description | Type | Default
--- | --- | --- | --- | --- |
inputFile | Yes | Full path to the source video file in the rclone remote | String |
outputFolder | Yes | Full path to the destination folder in the rclone remote | String |
showName | No | Name of the show used for fetching metadata | String |
subtitleFile | No | Full path to a subtitle file | String | Subtitle stream embedded in inputFile
subtitleOffset | No | Number of seconds to offset the subtitle | Number | 0
videoIndex | No | Video stream index that will be used from inputFile | Number | First available video stream
audioIndex | No | Audio stream index that will be used from inputFile | Number | First available audio stream
subIndex | No | Subtitle stream index that will be used from inputFile (will be used from subtitleFile instead if provided) | Number | First available subtitle stream
fontStyle | No | Font style used for text based hardsub | String | NotoSansJP-Medium
fontSize | No | Font size used for text based hardsub | Number | 36

Available font styles
- 02UtsukushiMincho
- Noto Sans JP Medium
- Noto Serif JP Medium
- Open Sans SemiBold

## `/queue`

### GET
  - Description: gets the queue in an array

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
