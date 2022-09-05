#!/bin/bash

# exit on any error
set -e

pushd "$(dirname "$0")/.." >/dev/null

if ! version=$(git describe --exact-match --tags 2>/dev/null); then
  # A git hash of the length of 7 is visible on github commits page.
  GIT_HASH_LENGTH=7
  version=$(git rev-parse --short=${GIT_HASH_LENGTH} HEAD 2>/dev/null) || true
fi

echo "${version}"
echo "$(whoami)@$(hostname)"
git status

popd >/dev/null
