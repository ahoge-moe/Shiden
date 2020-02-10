#!/bin/bash

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
mkdir -p temp/

######### CHANGE THESE VALUES #########
SOFTSUB="..."
HARDSUB="..."
#######################################

echo "rclone lsf softsub"
${script_path}/../../bin/rclone lsf "${SOFTSUB}" -R --files-only --exclude "{1,2,3,4,5,6,7,8,9,0,Bleach}**/**" > temp/softsub.txt
echo "rclone lsf hardsub"
${script_path}/../../bin/rclone lsf "${HARDSUB}" -R --files-only --exclude "{1,2,3,4,5,6,7,8,9,0,Bleach}**/**" > temp/hardsub.txt

# Remove extension from files
echo "Removing extension"
sed 's/.mkv$//' -i temp/softsub.txt
sed 's/.mp4$//' -i temp/hardsub.txt

# Sort before comm
echo "Sorting"
sort -n temp/softsub.txt > temp/softsub_sorted.txt
sort -n temp/hardsub.txt > temp/hardsub_sorted.txt

# Extract files in softsub_sorted_no_extension that are NOT in hardsub_sorted_no_extension
echo "Comparing"
comm -23 temp/softsub_sorted.txt temp/hardsub_sorted.txt > temp/diff.txt
