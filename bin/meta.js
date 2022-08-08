#!/usr/bin/env node

const { basename } = require('path');
const {
  readFileSync,
  writeFileSync,
} = require('fs');

const args = process.argv.slice(2);
const target = args[0];
const domains = args.slice(1);

const urls = domains.map((domain) => `*://${domain}/*`);

const index = readFileSync(`${target}/index.html`, 'utf8');
const jsFiles = index.match(/(?<=<script src=")[^"]+(?=" type="module">)/g);
const cssFiles = index.match(/(?<=<link rel="stylesheet" href=")[^"]+(?=">)/g);

const manifest = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
manifest.name = `Angular Mask for ${basename(target)}`;
manifest.content_scripts[0].matches = urls;
manifest.content_scripts[0].js = [...jsFiles, 'content.js'];
manifest.content_scripts[0].css = cssFiles;
manifest.web_accessible_resources[0].matches = urls;
writeFileSync(`${target}/manifest.json`, JSON.stringify(manifest, null, 2));

const rules = JSON.parse(readFileSync('src/rules.json', 'utf8'));
rules[0].condition.domains = domains;
writeFileSync(`${target}/rules.json`, JSON.stringify(rules, null, 2));
