#!/bin/bash

set -e

cd "$(dirname "$0")/.."

target=${1%/}
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
