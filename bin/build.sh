#!/bin/bash

set -e

name=$(jq -r '.name' <package.json)
basedir="$(dirname "$0")/.."
target="${basedir}/dist/${name}"

file=angular.json
while [ ! -e ${file} ]; do
  file=../${file}
done
port=$(jq -r '.projects["'"${name}"'"].architect.serve.options.port // 4200' <${file})
baseHref=$(jq -r '.projects["'"${name}"'"].architect.build.options.baseHref // "/"' <${file})

rm -rf "${target}"
mkdir -p "${target}"

cp -r "${basedir}/src/vanilla/." "${target}"

sed "s~<PORT>~${port}~g;s~<BASE>~${baseHref}~g" "${basedir}/src/background.js" >"${target}/background.js"

cp "${basedir}/src/manifest.json" "${target}"
cp "${basedir}/src/rules.json" "${target}"
node "${basedir}/bin/meta.js" "${name}" "${port}" "${target}" "${@}"

"${basedir}/bin/version.sh" >"${target}/angular-mask-version.txt"

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
