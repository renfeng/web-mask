#!/bin/bash

set -e

repo=https://github.com/vuejs/docs
target=../vuejs-docs
file=src/index.md

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
git checkout main
git pull
src=$(cat ${file})
# see also test/specs/vuejs.e2e.js
echo >${file} "${src/Vue.js - The Progressive JavaScript Framework/Web Mask is on!}"

npm install -g pnpm

pnpm i

pnpm run dev
