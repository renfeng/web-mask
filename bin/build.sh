#!/bin/bash

set -e

basedir="$(dirname "$0")/.."
target="${basedir}/dist/public"

rm -rf "${target}"
mkdir -p "${target}"

cp -r "${basedir}/src/vanilla/." "${target}"

"${basedir}/bin/version.sh" >"${target}/version.txt"

pushd >/dev/null "${target}"
zip -FSrq "../$(basename "${basedir}").zip" .
popd >/dev/null

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
