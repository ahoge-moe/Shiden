#!/bin/bash

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
mkdir -p temp/

######### CHANGE THESE VALUES #########
MANGA_PATH="..."
#######################################

# Delete .url files
echo "delete .url"
${script_path}/../../bin/rclone lsf "${MANGA_PATH}" -R --files-only --ignore-case --include "*.url" > temp/url.txt
while IFS= read -r file
do
  ${script_path}/../../bin/rclone delete "${MANGA_PATH}/${file}"
done < temp/url.txt

# Delete .*_original files
echo "delete .*_original"
${script_path}/../../bin/rclone lsf "${MANGA_PATH}" -R --files-only --ignore-case --include "*_original" > temp/original.txt
while IFS= read -r file
do
  ${script_path}/../../bin/rclone delete "${MANGA_PATH}/${file}"
done < temp/original.txt

# Print out files that are not images
echo "files not img"
${script_path}/../../bin/rclone lsf "${MANGA_PATH}" -R --files-only --ignore-case --exclude "*.{jpg,png,jpeg,bmp}" > temp/files_not_img.txt
sort -n temp/files_not_img.txt > temp/files_not_img_sorted.txt

# Print out Volume folders that have subfolders inside
echo "volumes with subfolder"
${script_path}/../../bin/rclone lsf "${MANGA_PATH}" -R --dirs-only | grep ".*/.*/.*/.*/" > temp/volumes_with_subfolder.txt
sort -n temp/volumes_with_subfolder.txt > temp/volumes_with_subfolder_sorted.txt

# Print out 単ページ folders
echo "単ページ subfolder"
${script_path}/../../bin/rclone lsf "${MANGA_PATH}" -R --dirs-only | grep "単ページ" > temp/single_page_subfolder.txt
sort -n temp/single_page_subfolder.txt > temp/single_page_subfolder_sorted.txt

# Remove the "title" metadata on all files
echo "exiftool"
exiftool -title="" "${MANGA_PATH}" -r -overwrite_original | grep -v "MicrosoftPhoto\|ThumbnailImage"
