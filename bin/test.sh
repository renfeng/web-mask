#!/bin/bash

set -e

pushd "$(dirname "$0")/.." >/dev/null

target=dist/public

echo TODO bin/run-angular.sh
echo TODO bin/run-reactjs.sh
echo TODO bin/run-vuejs.sh

rm -rf "${target}"
bin/build.sh

if command -v cygpath; then
  path=$(cygpath -w "$(realpath dist/public)")
  sed "s~dist/public~${path//\\/\\\\\\\\}~g" template-wdio.conf.js > wdio.conf.js
else
  cp template-wdio.conf.js wdio.conf.js
fi
npm run wdio || true

echo TODO bin/kill-angular.sh
echo TODO bin/kill-reactjs.sh
echo TODO bin/kill-vuejs.sh

popd >/dev/null
