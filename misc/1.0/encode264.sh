#!/bin/bash

# Colors

BLACK="\033[0;30m"
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
DEFAULT="\033[0;37m"
DARK_GRAY="\033[1;30m"
FG_RED="\033[1;31m"
FG_GREEN="\033[1;32m"
FG_YELLOW="\033[1;33m"
FG_BLUE="\033[1;34m"
FG_MAGENTA="\033[1;35m"
FG_CYAN="\033[1;36m"
FG_WHITE="\033[1;37m"

# $1 = show name
# $2 = file name
# $3 = endpoint

SHOW="$1"
INPUT_FILE="$2"
OUTPUT_FILE="${2%.mkv}.mp4"
ENDPOINT="$3"

SOURCE="source:Airing"
DESTINATION="dest:Airing [Hardsub]"
if [[ "$ENDPOINT" == "/x264/premiered" ]]; then
  SOURCE="source:Premiered"
  DESTINATION="dest:Premiered [Hardsub]"
fi

RCLONE_FLAGS=(--bwlimit 35M --stats-one-line --stats 60m -v)

FFMPEG_LOGLEVEL=(-loglevel panic)
AUDIO="copy"

sleep 10
echo -e "\033[1;34m[$(date +%F_%T)] Looking for \"$SOURCE/$SHOW/$INPUT_FILE\"...\033[0m"
LSF=$(./bin/rclone lsf "$SOURCE""/$SHOW/$INPUT_FILE")
if [ "$LSF" != "$INPUT_FILE" ]; then
  echo -e "\033[1;34m[$(date +%F_%T)] File not found.\033[0m"
  exit 3
fi

echo -e "\033[1;34m[$(date +%F_%T)] File found.\033[0m"
echo -e "\033[1;34m[$(date +%F_%T)] Downloading...\033[0m"
./bin/rclone copy "$SOURCE""/$SHOW/$INPUT_FILE" "./todo" "${RCLONE_FLAGS[@]}"
echo ""
echo -e "\033[1;34m[$(date +%F_%T)] Downloaded.\033[0m"
mv "./todo/$INPUT_FILE" "./todo/temp.mkv"

echo -e "\033[1;33m[$(date +%F_%T)] Encoding with libx264...\033[0m"
./bin/ffmpeg -i "./todo/temp.mkv" -vf subtitles="./todo/temp.mkv" -c:a $AUDIO -strict -2 -y "./done/$OUTPUT_FILE" "${FFMPEG_LOGLEVEL[@]}"

OUTPUT_SIZE=$(wc -c < "./done/$OUTPUT_FILE")
if [[ "$OUTPUT_SIZE" == "0" ]]; then
  echo -e "\033[1;33m[$(date +%F_%T)] Trying again with 10bit...\033[0m"
  ./bin/ffmpeg-10bit -i "./todo/temp.mkv" -vf subtitles="./todo/temp.mkv" -c:a $AUDIO -strict -2 -y "./done/$OUTPUT_FILE" "${FFMPEG_LOGLEVEL[@]}"
fi

OUTPUT_SIZE=$(wc -c < "./done/$OUTPUT_FILE")
if [[ "$OUTPUT_SIZE" == "0" ]]; then
  echo -e "\033[1;33m[$(date +%F_%T)] Trying again with filter complex...\033[0m"
  ./bin/ffmpeg -i "./todo/temp.mkv" -filter_complex "[0:v][0:s]overlay[v]" -map "[v]" -map 0:a -c:a $AUDIO -strict -2 -y "./done/$OUTPUT_FILE" "${FFMPEG_LOGLEVEL[@]}"
fi

OUTPUT_SIZE=$(wc -c < "./done/$OUTPUT_FILE")
if [[ "$OUTPUT_SIZE" == "0" ]]; then
  echo -e "\033[1;33m[$(date +%F_%T)] Trying again with 10bit filter complex...\033[0m"
  ./bin/ffmpeg-10bit -i "./todo/temp.mkv" -filter_complex "[0:v][0:s]overlay[v]" -map "[v]" -map 0:a -c:a $AUDIO -strict -2 -y "./done/$OUTPUT_FILE" "${FFMPEG_LOGLEVEL[@]}"
fi

OUTPUT_SIZE=$(wc -c < "./done/$OUTPUT_FILE")
if [[ "$OUTPUT_SIZE" == "0" ]]; then
  echo -e "\033[1;33m[$(date +%F_%T)] Encoding failed.\033[0m"
  echo -e "\033[1;31m[$(date +%F_%T)] Removing local files...\033[0m"
  rm ./todo/*.mkv
  rm ./done/*.mp4
  exit 4
fi

echo -e "\033[1;33m[$(date +%F_%T)] Encoded.\033[0m"
echo -e "\033[1;33m[$(date +%F_%T)] Output file size ::: $OUTPUT_SIZE ;;;\033[0m"
echo -e "\033[1;34m[$(date +%F_%T)] Uploading \"$OUTPUT_FILE\" to \"$DESTINATION/$SHOW\"\033[0m"
./bin/rclone copy "./done/$OUTPUT_FILE" "$DESTINATION""/$SHOW" "${RCLONE_FLAGS[@]}"
echo ""
echo -e "\033[1;34m[$(date +%F_%T)] Uploaded.\033[0m"
echo -e "\033[1;31m[$(date +%F_%T)] Removing local files...\033[0m"
rm ./todo/*.mkv
rm ./done/*.mp4
