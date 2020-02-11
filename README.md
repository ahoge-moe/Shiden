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

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| sourceFile | Yes | String | | Full path to the source file in the rclone remote |
| destFolder | Yes | String | | Full path to the destination folder in the rclone remote |
| showName | No | String | | Name of the show used for fetching metadata |
| videoIndex | No | Number | First available | Stream index that will be used for video |
| audioIndex | No | Number | First available | Stream index that will be used for audio |
| subIndex | No | Number | First available | Stream index that will be used for subtitle |
| fontStyle | No | String | NotoSansJP-Medium | Font style used for text based hardsub |

# Error codes

| Code | Description |
| --- | --- |
| 600 | Rclone failed to download |
| 601 | Rclone failed to upload |
