#!/bin/bash

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "${script_path}"

for file in "${script_path}"/*
do
  if [ "$(basename ${file})" != "test_suite.sh" ]; then
    echo "Testing $(basename ${file})"
    ${file}
    echo ""
  fi
done