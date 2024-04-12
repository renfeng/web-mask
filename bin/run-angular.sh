#!/bin/bash

set -e

repo=https://github.com/angular/material.angular.io
target=../material.angular.io
file=src/app/pages/page-title/page-title.ts

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
git checkout main
git pull
src=$(cat ${file})
# see also test/specs/angular.e2e.js
echo >${file} "${src/Angular Material UI component library/Web Mask is on!}"

npm install --global yarn

yarn install

yarn start -- --live-reload=false
