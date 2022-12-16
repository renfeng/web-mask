#!/bin/bash

set -e

pushd "$(dirname "$0")/.." >/dev/null

target=dist/public

echo TODO bin/run-angular.sh
echo TODO bin/run-reactjs.sh
bin/run-vuejs.sh

rm -rf "${target}"
bin/build.sh

if command -v cygpath; then
  path=$(cygpath -w "$(realpath dist/public)")
  sed -i "s~dist/public~${path//\\/\\\\\\\\}~g" wdio.conf.js
fi
npm run wdio || true

bin/kill-vuejs.sh
echo TODO bin/kill-angular.sh
echo TODO bin/kill-reactjs.sh

popd >/dev/null
