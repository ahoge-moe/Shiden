#!/bin/bash

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
mkdir -p plextemp/

######### CHANGE THESE VALUES #########
SRC="..."
DEST="..."
#######################################

CYAN="\033[0;36m"
FG_CYAN="\033[1;36m"
FG_YELLOW="\033[1;33m"
FG_GREEN="\033[1;32m"
FG_MAGENTA="\033[1;35m"
DEFAULT="\033[0;37m"
DARK_GRAY="\033[1;30m"

echo -e "${FG_CYAN}lsf src:${DEFAULT}"
${script_path}/../../bin/rclone lsf "${SRC}" --dirs-only > plextemp/shows_in_src.txt
echo -e "${FG_CYAN}lsf dest:${DEFAULT}"
${script_path}/../../bin/rclone lsf "${DEST}" --dirs-only > plextemp/shows_in_dest.txt

comm -23 plextemp/shows_in_src.txt plextemp/shows_in_dest.txt > plextemp/shows_in_src_and_not_in_dest.txt
comm -23 plextemp/shows_in_dest.txt plextemp/shows_in_src.txt > plextemp/shows_in_dest_and_not_in_src.txt
comm -12 plextemp/shows_in_src.txt plextemp/shows_in_dest.txt > plextemp/shows_in_both.txt

echo -e "${FG_CYAN}Shows in SRC[✔], DEST[X]: COPY${DEFAULT}"
while IFS= read -r show
do
  echo -e "${CYAN}lsf ${show}${DEFAULT}"
  ${script_path}/../../bin/rclone lsf "${SRC}/${show}" --exclude "{poster,background,banner}.*" > plextemp/files.txt

  while IFS= read -r file
  do
    SEASON_NUMBER="$(echo "${file}" | grep -o "S[0-9]\+ -" | cut -d " " -f 1 | sed "s/S//")"
    NEW_NAME="$(echo "${file}" | sed "s/S[0-9]\+ -/Season ${SEASON_NUMBER} -/")"
    echo -e "${FG_YELLOW}${file}${DEFAULT} => ${FG_GREEN}${NEW_NAME}${DEFAULT}"
    ${script_path}/../../bin/rclone copyto "${SRC}/${show}${file}" "${DEST}/${show}${NEW_NAME}" --progress --stats-one-line --stats 1s -v --bwlimit 30M
  done < plextemp/files.txt
done < plextemp/shows_in_src_and_not_in_dest.txt

echo -e "${FG_CYAN}Shows in SRC[✔], DEST[✔]: COMPARE${DEFAULT}"
while IFS= read -r show
do
  echo -e "${CYAN}size ${show}${DEFAULT}"
  SRC_FILE_COUNT=$(${script_path}/../../bin/rclone size "${SRC}/${show}" --json --exclude "{poster,background,banner}.*" | jq -r ".count")
  DEST_FILE_COUNT=$(${script_path}/../../bin/rclone size "${DEST}/${show}" --json --exclude "{poster,background,banner}.*" | jq -r ".count")

  if [ "${SRC_FILE_COUNT}" -gt "${DEST_FILE_COUNT}" ]; then
    echo -e "${FG_MAGENTA}SRC > DEST: COPY NEW FILES${DEFAULT}"
    ${script_path}/../../bin/rclone lsf "${SRC}/${show}" --exclude "{poster,background,banner}.*" > plextemp/files_in_src.txt
    ${script_path}/../../bin/rclone lsf "${DEST}/${show}" --exclude "{poster,background,banner}.*" > plextemp/files_in_dest.txt
    SEASON_NUMBER="$(head -n 1 plextemp/files_in_dest.txt | grep -o "Season [0-9]\+ -" | cut -d " " -f 2)"
    sed "s/Season [0-9]\+ -/S${SEASON_NUMBER} -/" -i plextemp/files_in_dest.txt
    comm -23 plextemp/files_in_src.txt plextemp/files_in_dest.txt > plextemp/files_in_src_and_not_in_dest.txt

    while IFS= read -r file
    do
      # SEASON_NUMBER="$(echo "${file}" | grep -o "S[0-9]\+ -" | cut -d " " -f 1 | sed "s/S//")"
      NEW_NAME="$(echo "${file}" | sed "s/S[0-9]\+ -/Season ${SEASON_NUMBER} -/")"
      echo -e "${FG_YELLOW}${file}${DEFAULT} => ${FG_GREEN}${NEW_NAME}${DEFAULT}"
      ${script_path}/../../bin/rclone copyto "${SRC}/${show}${file}" "${DEST}/${show}${NEW_NAME}" --progress --stats-one-line --stats 1s -v --bwlimit 30M
    done < plextemp/files_in_src_and_not_in_dest.txt

  elif [ "${SRC_FILE_COUNT}" -lt "${DEST_FILE_COUNT}" ]; then
    echo -e "${FG_MAGENTA}SRC < DEST: DELETE EXTRA FILES${DEFAULT}"
    ${script_path}/../../bin/rclone lsf "${SRC}/${show}" --exclude "{poster,background,banner}.*" > plextemp/files_in_src.txt
    ${script_path}/../../bin/rclone lsf "${DEST}/${show}" --exclude "{poster,background,banner}.*" > plextemp/files_in_dest.txt
    SEASON_NUMBER="$(head -n 1 plextemp/files_in_src.txt | grep -o "S[0-9]\+ -" | cut -d " " -f 1 | sed "s/S//")"
    sed "s/S[0-9]\+ -/Season ${SEASON_NUMBER} -/" -i plextemp/files_in_src.txt
    comm -23 plextemp/files_in_dest.txt plextemp/files_in_src.txt > plextemp/files_in_dest_and_not_in_src.txt

    while IFS= read -r file
    do
      echo -e "${FG_YELLOW}delete ${file}${DEFAULT}"
      ${script_path}/../../bin/rclone delete "${DEST}/${show}${file}"
    done < plextemp/files_in_dest_and_not_in_src.txt
  else
    echo -e "${DARK_GRAY}SRC = DEST: DO NOTHING${DEFAULT}"
  fi
done < plextemp/shows_in_both.txt

echo -e "${FG_CYAN}Shows in SRC[X], DEST[✔]: PURGE${DEFAULT}"
while IFS= read -r show
do
  echo -e "${CYAN}purge ${show}${DEFAULT}"
  ${script_path}/../../bin/rclone purge "${DEST}/${show}"
done < plextemp/shows_in_dest_and_not_in_src.txt

echo -e "${FG_CYAN}download posters${DEFAULT}"
node src/plex/poster.js "wizo:Media/Anime/Airing [Hardsub]"
