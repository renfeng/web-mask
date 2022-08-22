#!/bin/bash

set -e

basedir="$(dirname "$0")/.."

target=${1%/}

# TODO exclude non module files
js_files=$(find "${target}" -type f -name "*.js" | sed "s|${target}/||")
js_array=$(printf '%s\n' "${js_files[@]}" | jq -R . | jq -s .)

css_files=$(find "${target}" -type f -name "*.css" | sed "s|${target}/||")
css_array=$(printf '%s\n' "${css_files[@]}" | jq -R . | jq -s .)

manifest=$(cat "${basedir}/src/manifest.json")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].js'="${js_array}")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].css'="${css_array}")
echo "${manifest}" >"${target}/manifest.json"
cp "${basedir}/src/rules.json" "${target}"

node "${basedir}/bin/meta.js" "${target}" "${@:2}"

css_files=()
while read -r css_file; do
  css_files+=("${css_file}")
done <<<"$(grep -rl "url[(]" "${target}"/* --include "*.css")"
if [ -n "${css_files[*]}" ]; then
  node "${basedir}/bin/css.js" "${target}" "${css_files[@]}"
fi

cp -r "${basedir}/src/vanilla/." "${target}"

"${basedir}/bin/version.sh" >"${target}/angular-mask-version.txt"

echo
echo "Open in Chrome, chrome://extensions"
echo "Load unpacked"
echo "Copy and paste the following path"
if (command -v cygpath >/dev/null); then
  cygpath -w "$(realpath "${target}")"
else
  realpath "${target}"
fi
