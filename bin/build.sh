#!/bin/bash

set -e

cd "$(dirname "$0")/.."

target=${1%/}

# TODO exclude non module files
js_files=$(find "${target}" -type f -name "*.js" | sed "s|${target}/||")
js_array=$(printf '%s\n' "${js_files[@]}" | jq -R . | jq -s .)

css_files=$(find "${target}" -type f -name "*.css" | sed "s|${target}/||")
css_array=$(printf '%s\n' "${css_files[@]}" | jq -R . | jq -s .)

manifest=$(cat src/manifest.json)
manifest=$(echo "${manifest}" | jq '.content_scripts[0].js'="${js_array}")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].css'="${css_array}")
echo "${manifest}" >"${target}/manifest.json"
cp src/rules.json "${target}"

if (command -v cygpath >/dev/null); then
  target="$(cygpath -w "${target}")"
fi

bin/meta.js "${target}" "${@:2}"

css_files=()
while read -r css_file; do
  css_files+=("${css_file}")
done <<<"$(grep -rl "url[(]" "${target}"/* --include "*.css")"
bin/css.js "${target}" "${css_files[@]}"

cp -r src/vanilla/. "${target}"

bin/version.sh >"${target}/angular-mask-version.txt"
