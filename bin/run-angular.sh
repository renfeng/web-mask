#!/bin/bash

set -e

repo=https://github.com/angular/material.angular.io
target=../material.angular.io
port=4200

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
#  git checkout 15.0.4
  git checkout 14.2.12
fi
cd ${target}
src=$(cat src/app/pages/page-title/page-title.ts)
echo >src/app/pages/page-title/page-title.ts "${src/Angular Material UI component library/Web Mask is on!}"
yarn install
# yarn start &

# while ! curl >/dev/null -s http://localhost:${port}/; do
#   sleep 1
# done
yarn start
