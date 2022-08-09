#!/usr/bin/env node

const { dirname } = require('path');
const { readFileSync, writeFileSync } = require('fs');

const args = process.argv.slice(2);
const target = args[0];
const cssFiles = args.slice(1);

cssFiles.forEach((cssFile) => {
  const path = dirname(cssFile.substring(target.length));
  const css = readFileSync(cssFile, 'utf8');

  const filtered = [
    ...(css.match(new RegExp(`(?<=url[(]")(?!data:image/)[^"]+(?="[)])`, 'g')) || []).map((url) => ({ url, quote: '"' })),
    ...(css.match(new RegExp(`(?<=url[(]')(?!data:image/)[^']+(?='[)])`, 'g')) || []).map((url) => ({ url, quote: "'" })),
    ...(css.match(new RegExp(`(?<=url[(])(?!['"]|data:image/)(?:\\\\[)]|[^)])+(?=[)])`, 'g')) || []).map((url) => ({ url, quote: '' })),
  ]
    .map(({ url, quote }) => ({ url, quote, replacement: buildReplacement(url, path) }))
    .map(({ url, replacement, quote }) => {
      console.log();
      console.log(url);
      console.log(replacement);
      return { url, replacement, quote };
    })
    .reduce(
      (result, { url, replacement, quote }) =>
        !replacement ? result : result.replace(`(${quote}${url}${quote})`, `(${quote}${replacement}${quote})`),
      css
    );

  writeFileSync(cssFile, filtered);
});

function buildReplacement(url, path) {
  try {
    new URL(url);
    return null;
  } catch (error) {
    return new URL(url.startsWith('/') ? url : `${path}/${url}`, 'chrome-extension://__MSG_@@extension_id__/').href;
  }
}
