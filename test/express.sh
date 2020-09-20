#!/bin/bash

curl -X POST http://localhost:64000/hardsub/file \
  -H 'Content-Type: application/json' \
  -H 'Authorization: key_1' \
  -d '{ "inputFile": "Premiered/Grand Blue/Grand Blue - 01 [1080p].mkv",
  "outputFolder": "Premiered [Hardsub]/Grand Blue",
  "showName": "Grand Blue"
  }'