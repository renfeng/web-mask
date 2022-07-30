#!/bin/bash

set -e

pushd "$(dirname "$0")/.." > /dev/null

rm -rf dist
mkdir -p dist/unpacked
cp src/manifest.json dist/unpacked
cp -r src/vanilla/. dist/unpacked

bin/version.sh > dist/unpacked/version.txt

cd dist/unpacked
zip -r ../chrome-extension.zip .

popd > /dev/null
