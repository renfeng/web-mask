#!/bin/bash

set -e

repo=https://github.com/reactjs/reactjs.org
target=../reactjs.org
file=src/content/index.md
#port=8000

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
git pull
src=$(cat ${file})
echo >${file} "${src/React – The library for web and native user interfaces/Web Mask is on!}"
yarn
#yarn dev &
#
#while ! curl >/dev/null -s http://localhost:${port}/; do
#  sleep 1
#done
yarn dev
