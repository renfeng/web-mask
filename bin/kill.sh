#!/bin/bash

set -e

port=$1
pid=$(lsof -i -P -n | grep ":${port} (LISTEN)" | perl -nle 'print $& if m{(?<=node      )\d+}')
if [ -n "${pid}" ]; then
  kill "${pid}"
  echo
fi
