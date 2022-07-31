#!/bin/bash

set -e

pushd "$(dirname "$0")/.." >/dev/null

source=${1}
domains=("${@:2}")

domain_array=$(printf '%s\n' "${domains[@]}" | jq -R . | jq -s .)

urls=()
for domain in "${domains[@]}"; do
  urls+=("*://${domain}/*")
done
url_array=$(printf '%s\n' "${urls[@]}" | jq -R . | jq -s .)

rm -rf dist
mkdir -p dist/unpacked

cp -r "${source}/." dist/unpacked

#js_files=$(perl -nle 'print for /(?<=<script src=")[^"]+(?=" type="module">)/g' <dist/unpacked/index.html)
js_files=$(find dist/unpacked -type f -name "*.js" | sed 's|dist/unpacked/||')
js_array=$(printf '%s\n' "${js_files[@]}" | jq -R . | jq -s .)

#css_files=$(perl -nle 'print for /(?<=<link href=")[^"]+(?=[?]\w+" rel="stylesheet">)/g' < dist/unpacked/index.html)
#css_files+=(styles.css)
css_files=$(find dist/unpacked -type f -name "*.css" | sed 's|dist/unpacked/||')
css_array=$(printf '%s\n' "${css_files[@]}" | jq -R . | jq -s .)

manifest=$(cat src/manifest.json)
manifest=$(echo "${manifest}" | jq '.content_scripts[0].matches'="${url_array}")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].js'="${js_array}")
manifest=$(echo "${manifest}" | jq '.content_scripts[0].css'="${css_array}")
manifest=$(echo "${manifest}" | jq '.host_permissions'="${url_array}")
echo "${manifest}" >dist/unpacked/manifest.json

rules=$(cat src/rules.json)
rules=$(echo "${rules}" | jq '.[0].condition.domains'="${domain_array}")
echo "${rules}" >dist/unpacked/rules.json

cp -r src/vanilla/. dist/unpacked

bin/version.sh >dist/unpacked/version.txt

cd dist/unpacked
zip -r ../chrome-extension.zip .

popd >/dev/null
