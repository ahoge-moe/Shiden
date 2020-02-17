# About
Shiden (紫電), meaning "purple lightning" in Japanese, is a web server (built with **ExpressJS**) that facilitates the automation of hardsubbing video files using **ffmpeg**.
It downloads from and uploads to remote/local storages using **rclone**.

# Requirements
- x86_64 CPU architecture
- Ubuntu
- Node.js
- npm

# Getting Started

1. Clone repo
```bash
git clone https://github.com/wizo06/Shiden.git
```
2. Download binaries, configure rclone, and install Nodejs dependencies
```bash
./prepare.sh
```
3. Edit `conf/user_config.toml` and `conf/user_auth.yml`
4. Run Shiden
```bash
npm start
```

# Routes

## `/hardsub/file`

### POST
  - Description: creates a job for one file
  - Headers:
    - `Authorization: authorization_key_1`
    - `Content-Type: application/json`
  - Body:
   ```json
  {
      "sourceFile": "TODO/FILE NAME.MKV",
      "destFolder": "DONE",
  }
  ``` 

Field | Required | Description | Type | Default 
--- | --- | --- | --- | --- |
sourceFile | Yes | Full path to the source file in the rclone remote | String |
destFolder | Yes | Full path to the destination folder in the rclone remote | String | 
showName | No | Name of the show used for fetching metadata | String |
subtitleFile | No | Full path to an external subtitle file | String | Subtitle stream embedded in video file 
videoIndex | No | Stream index that will be used for video | Number | First available 
audioIndex | No | Stream index that will be used for audio | Number | First available 
subIndex | No | Stream index that will be used for subtitle | Number | First available 
fontStyle | No | Font style used for text based hardsub | String | NotoSansJP-Medium 
fontSize | No | Font size used for text based hardsub | Number | 24

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
| 600 | Rclone failed to download |
| 601 | Rclone failed to upload |
| 700 | FFmpeg failed to prepare |
| 701 | FFmpeg failed to change container |
| 702 | FFmpeg failed to extract subtitle file |
| 703 | FFmpeg failed to hardsub with text-based flags |
| 704 | FFmpeg failed to hardsub with bitmap-based flags |
| 800 | FFprobe failed to extract stream info from file |
| 801 | FFprobe failed to return video flags |
| 802 | FFprobe failed to return audio flags |
| 803 | FFprobe failed to return info about subtitle stream |
| 900 | promisefied.exec() exited with non-0 code |
| 901 | promisefied.request() returned with error |
| 902 | promisefied.jsonParse() failed to parse string because of SyntaxError |