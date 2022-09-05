#!/bin/bash

set -e

basedir="$(dirname "$0")/.."
target="${basedir}/dist/public"

cp -r "${basedir}/src/vanilla/." "${target}"

"${basedir}/bin/version.sh" >"${target}/version.txt"

echo
echo 'Open in Chrome, chrome://extensions'
echo 'Enable "Developer mode"'
echo 'Load unpacked'
echo 'Copy and paste the following path'
if (command -v cygpath >/dev/null); then
  cygpath -w "$(realpath "${target}")"
else
  realpath "${target}"
fi
