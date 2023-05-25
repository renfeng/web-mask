#!/bin/bash

set -e

repo=https://github.com/angular/material.angular.io
target=../material.angular.io
#port=4200

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
git checkout 14.x
src=$(cat src/app/pages/page-title/page-title.ts)
echo >src/app/pages/page-title/page-title.ts "${src/Angular Material UI component library/Web Mask is on!}"
yarn install
# yarn start &

# while ! curl >/dev/null -s http://localhost:${port}/; do
#   sleep 1
# done
yarn start -- --live-reload=false

# nodejs v14
# npm install --global yarn
# yarn config set "strict-ssl" false
# ng server --live-reload=false
