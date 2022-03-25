# What is Shiden?

Shiden is a collection of microservices for acquiring and hardsubbing video files.

- Shiden follows the Event-Driven Architecture paradigm, and it uses RabbitMQ as the message broker.
- All services are connection failure tolerant. Shiden will attempt to reconnect to RabbitMQ if it loses connection, with an exponential backoff retry.

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

# Contribution

## Local development

- [Go]
- [FFmpeg]
- [rclone]
- [docker]
- [protoc]

Create a RabbitMQ container

```console
$ docker run -d --hostname my-rabbit -e RABBITMQ_DEFAULT_USER=user -e RABBITMQ_DEFAULT_PASS=password -p 8080:15672 -p 5672:5672 rabbitmq:3-management
```

Generate from proto files

```console
$ protoc --go_out=. ./proto/*
```