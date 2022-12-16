#!/bin/bash

set -e

port=$1

if command -v taskkill; then
  pid=$(netstat -ano | grep "0.0.0.0:${port}" | perl -nle 'print $& if m{(?<=LISTENING       )\d+}')
  if [ -n "${pid}" ]; then
    taskkill /F /PID "${pid}"
  else
    echo "No server process found."
  fi
else
  pid=$(lsof -i -P -n | grep ":${port} (LISTEN)" | perl -nle 'print $& if m{(?<=node      )\d+}')
  if [ -n "${pid}" ]; then
    kill "${pid}"
  else
    echo "No server process found."
  fi
fi
