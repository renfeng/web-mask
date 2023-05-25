#!/bin/bash

set -e

repo=https://github.com/vuejs/docs
target=../vuejs-docs
#port=5173

if [ ! -e ${target} ]; then
  git clone ${repo} ${target}
fi
cd ${target}
src=$(cat src/index.md)
# see also test/specs/vuejs.e2e.js
echo >src/index.md "${src/Vue.js - The Progressive JavaScript Framework/Web Mask is on!}"
pnpm i
# pnpm run dev &
#
# while ! curl >/dev/null -s http://localhost:${port}/; do
#   sleep 1
# done

# TODO disable Hot Reload (web sockets)
# https://vue-loader.vuejs.org/guide/hot-reload.html#disabling-hot-reload
# https://github.com/vitejs/vite/issues/10840
export NODE_ENV=production

pnpm run dev
