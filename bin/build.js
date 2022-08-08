#!/usr/bin/env node

const { resolve, basename } = require('path');
const {
  promises: { readdir },
  readFileSync,
  writeFileSync,
} = require('fs');
const { execSync } = require('child_process');

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

const args = process.argv.slice(2);
const target = args[0];
const domains = args.slice(1);

const urls = domains.map((domain) => `*://${domain}/*`);

(async () => {
  const jsFiles = [];
  const cssFiles = [];
  for await (const file of getFiles(target)) {
    if (file.endsWith('.js')) {
      jsFiles.push(file.substring(target.length));
    } else if (file.endsWith('.css')) {
      cssFiles.push(file.substring(target.length));
    }
  }

  const manifest = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
  manifest.name = `Angular Mask for ${basename(target)}`;
  manifest.content_scripts[0].matches = urls;
  manifest.content_scripts[0].js = jsFiles;
  manifest.content_scripts[0].css = cssFiles;
  writeFileSync(`${target}/manifest.json`, JSON.stringify(manifest, null, 2));

  const rules = JSON.parse(readFileSync('src/rules.json', 'utf8'));
  rules[0].condition.domains = domains;
  writeFileSync(`${target}/rules.json`, JSON.stringify(rules, null, 2));

  execSync(`cp -r src/vanilla/. "${target}"`);
  execSync(`bin/version.sh >"${target}/angular-mask-version.txt"`);
})();
