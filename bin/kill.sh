#!/bin/bash

set -e

port=$1

if command -v taskkill; then
  OCT="(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])"
  IPv4="${OCT}\.${OCT}\.${OCT}\.${OCT}"
  pid=$(netstat -ano | grep -P "${IPv4}:${port}" | perl -nle 'print $& if m{(?<=LISTENING       )\d+}')
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
