#!/bin/bash

set -e

cd "$(dirname "$0")/.."

target=${1%/}

bin/meta.js "${target}" "${@:2}"

cp -r src/vanilla/. "${target}"

bin/version.sh >"${target}/angular-mask-version.txt"
