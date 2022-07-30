#!/bin/bash

# exit on any error
set -e

pushd "$(dirname "$0")/.." > /dev/null

if ! version=$(git describe --exact-match --tags 2> /dev/null); then
  # A git hash of the length of 10 is visible on the github license page. See CREDIT.md
  GIT_HASH_LENGTH=10
  if ! version=$(git rev-parse --short=${GIT_HASH_LENGTH} HEAD 2> /dev/null); then
    echo
  fi
fi

if [ "${version}" ]; then
  echo "${version}"
  echo "https://git.swisscom.com/users/taarefr1/repos/chrome-extension/commits/${version}"
  echo "$(whoami)@$(hostname)"
  git status
else
  echo ""
  echo "https://git.swisscom.com/users/taarefr1/repos/chrome-extension/browse"
  echo "$(whoami)@$(hostname)"
fi

popd > /dev/null
