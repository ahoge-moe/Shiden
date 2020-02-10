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

if dpkg --get-selections | grep -q "^unzip[[:space:]]*install$" >/dev/null; then
  _success "unzip installed"
else
  _info "installing unzip"
  sudo apt install unzip
fi

if dpkg --get-selections | grep -q "^tar[[:space:]]*install$" >/dev/null; then
  _success "tar installed"
else
  _info "installing tar"
  sudo apt install tar
fi

if dpkg --get-selections | grep -q "^curl[[:space:]]*install$" >/dev/null; then
  _success "curl installed"
else
  _info "installing curl"
  sudo apt install curl
fi

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "${script_path}"
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

# Rclone config
if [ -f conf/rclone.conf ]; then
  _success "Found rclone.conf"
else
  _info "Configuring rclone ..."
  bin/rclone config --config conf/rclone.conf
fi

# node_modules
if [ -d node_modules ]; then
  _success "Found node modules/"
else
  _info "Installing node modules"
  npm i
fi

# Config files
branch_name=$(cat .git/HEAD | cut -d "/" -f 3)
if [ "${branch_name}" == "master" ]; then

  if [ -f conf/user_config.toml ]; then
    _success "Found user_config.toml"
  else
    _info "Creating user_config.toml ..."
    cp conf/template_config.toml conf/user_config.toml
    _success "Created user_config.toml"
    _info "Please make the necessary changes in conf/user_config.toml"
  fi

  if [ -f conf/user_auth.yml ]; then
    _success "Found user_auth.yml"
  else
    _info "Creating user_auth.yml ..."
    cp conf/template_auth.yml conf/user_auth.yml
    _success "Created user_auth.yml"
    _info "Please make the necessary changes in conf/user_auth.yml"
  fi

else

  if [ -f conf/dev_config.toml ]; then
    _success "Found dev_config.toml"
  else
    _info "Creating dev_config.toml ..."
    cp conf/template_config.toml conf/dev_config.toml
    _success "Created dev_config.toml"
    _info "Please make the necessary changes in conf/dev_config.toml"
  fi

  if [ -f conf/dev_auth.yml ]; then
    _success "Found dev_auth.yml"
  else
    _info "Creating dev_auth.yml ..."
    cp conf/template_auth.yml conf/dev_auth.yml
    _success "Created dev_auth.yml"
    _info "Please make the necessary changes in conf/dev_auth.yml"
  fi

fi
