#!/bin/bash

set -e

pushd "$(dirname "$0")/.." >/dev/null

target=${1%/}
domains=("${@:2}")

domain_array=$(printf '%s\n' "${domains[@]}" | jq -R . | jq -s .)

urls=()
for domain in "${domains[@]}"; do
  urls+=("*://${domain}/*")
done
url_array=$(printf '%s\n' "${urls[@]}" | jq -R . | jq -s .)

#js_files=$(perl -nle 'print for /(?<=<script src=")[^"]+(?=" type="module">)/g' <"${target}/index.html")
js_files=$(find "${target}" -type f -name "*.js" | sed "s|${target}/||")
js_array=$(printf '%s\n' "${js_files[@]}" | jq -R . | jq -s .)

#css_files=$(perl -nle 'print for /(?<=<link href=")[^"]+(?=[?]\w+" rel="stylesheet">)/g' <"${target}/index.html")
#css_files+=(styles.css)
css_files=$(find "${target}" -type f -name "*.css" | sed "s|${target}/||")
css_array=$(printf '%s\n' "${css_files[@]}" | jq -R . | jq -s .)

manifest=$(cat src/manifest.json)
manifest=$(echo "${manifest}" | jq '.name'="\"Angular Mask for $(basename "${target}")\"")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].matches'="${url_array}")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].js'="${js_array}")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].css'="${css_array}")
manifest=$(echo "${manifest}" | jq '.host_permissions'="${url_array}")
echo "${manifest}" >"${target}/manifest.json"

rules=$(cat src/rules.json)
rules=$(echo "${rules}" | jq '.[0].condition.domains'="${domain_array}")
echo "${rules}" >"${target}/rules.json"

cp -r src/vanilla/. "${target}"

bin/version.sh >"${target}/angular-mask-version.txt"

popd >/dev/null
