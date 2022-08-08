#!/bin/bash

# exit on any error
set -e

pushd "$(dirname "$0")/.." >/dev/null

if ! version=$(git describe --exact-match --tags 2>/dev/null); then
  # A git hash of the length of 11 is visible on bitbucket commits page.
  GIT_HASH_LENGTH=11
  version=$(git rev-parse --short=${GIT_HASH_LENGTH} HEAD 2>/dev/null) || true
fi

echo "${version}"
echo "https://git.swisscom.com/users/taarefr1/repos/chrome-extension/commits/${version}"
echo "$(whoami)@$(hostname)"
git status

popd >/dev/null
