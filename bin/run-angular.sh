#!/bin/bash

set -e

repo=https://github.com/angular/material.angular.io
target=../material.angular.io
file=src/app/pages/page-title/page-title.ts

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
git pull
git checkout 14.x
src=$(cat ${file})
echo >${file} "${src/Angular Material UI component library/Web Mask is on!}"

npm install --global yarn

yarn install

yarn start -- --live-reload=false
