#!/bin/bash

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

_success () {
  echo -e "${FG_GREEN}✔ ${FG_WHITE}${1}${DEFAULT}"
}

_info () {
  echo -e "${FG_CYAN}i ${FG_WHITE}${1}${DEFAULT}"
}

mkdir -p bin

# FFmpeg and FFprobe
if [ -f bin/ffmpeg ] && [ -f bin/ffprobe ]; then
  _success "Found FFmpeg and FFprobe binaries"
else
  _info "Downloading ffmpeg and ffprobe ..."
  cd bin
  curl -s -o "ffmpeg.tar.xz" "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
  tar -xf "ffmpeg.tar.xz"
  rm "ffmpeg.tar.xz"

  _info "Moving ffmpeg and ffprobe binaries to bin/ ..."
  cd */.
  mv ffmpeg ../
  mv ffprobe ../

  _info "Cleaning up ..."
  rm -rf *
  cd ..
  rmdir *
  chmod 700 ffmpeg ffprobe
  cd ..
  _success "Installed FFmpeg and FFprobe"
fi

# Rclone
if [ -f bin/rclone ]; then
  _success "Found Rclone binary"
else
  _info "Downloading rclone ..."
  cd bin
  curl -s -o "rclone.zip" "https://downloads.rclone.org/rclone-current-linux-amd64.zip"
  unzip -qq rclone.zip
  rm rclone.zip

  _info "Moving rclone binary to bin/ ..."
  cd */.
  mv rclone ../
  
  _info "Cleaning up ..."
  rm -rf *
  cd ..
  rmdir *
  chmod 700 rclone
  cd ..
  _success "Installed rclone"
fi

cp config/config-template.toml config/user_config.toml
npm i
