#!/bin/bash

set -e

repo=https://github.com/reactjs/reactjs.org
target=../reactjs.org
port=8000

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
src=$(cat src/pages/index.js)
echo >src/pages/index.js "${src/React &ndash; A JavaScript library for building user interfaces/Web Mask is on!}"
yarn
yarn dev &

while ! curl >/dev/null -s http://localhost:${port}/; do
  sleep 1
done
