#!/bin/bash

set -e

repo=https://github.com/angular/angular
target=../angular
port=4200

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
#  git checkout 15.0.4
  git checkout 14.2.12
fi
cd ${target}/aio
src=$(cat src/app/layout/doc-viewer/doc-viewer.component.ts)
echo >src/app/layout/doc-viewer/doc-viewer.component.ts "${src/Angular/Web Mask is on!}"
yarn
yarn start &

while ! curl >/dev/null -s http://localhost:${port}/; do
  sleep 1
done
