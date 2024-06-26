#!/bin/bash

set -e

repo=https://github.com/reactjs/reactjs.org
target=../reactjs.org
file=src/content/index.md

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
git checkout main
git pull
src=$(cat ${file})
# see also test/specs/react.e2e.js
echo >${file} "${src/React/Web Mask is on!}"

npm install --global yarn

# requires libpng-dev
yarn

# TODO disable or change hmr origin
yarn dev
