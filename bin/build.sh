#!/bin/bash

set -e

basedir="$(dirname "$0")/.."
target="${basedir}/dist/public"

mkdir -p "${target}"
rsync --exclude=*.test.mjs -r "${basedir}/chrome-extension/." "${target}"

"${basedir}/bin/version.sh" >"${target}/version.txt"

echo 'Open in Chrome, chrome://extensions'
echo 'Enable "Developer mode"'
echo 'Load unpacked'
echo 'Copy and paste the following path'
if (command -v cygpath >/dev/null); then
  cygpath -w "$(realpath "${target}")"
else
  realpath "${target}"
fi
