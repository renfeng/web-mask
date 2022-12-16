#!/bin/bash

set -e

pushd "$(dirname "$0")/.." >/dev/null

target=dist/public

echo TODO bin/run-angular.sh
echo TODO bin/run-reactjs.sh
bin/run-vuejs.sh

rm -rf "${target}"
bin/build.sh
npm run wdio || true

bin/kill-vuejs.sh
echo TODO bin/kill-angular.sh
echo TODO bin/kill-reactjs.sh

popd >/dev/null
