const { readFileSync, writeFileSync } = require('fs');

const args = process.argv.slice(2);
const name = args[0];
const port = args[1];
const target = args[2];
const domains = args.slice(3);

const urls = domains.map((domain) => `*://${domain}/*`);

const manifest = JSON.parse(readFileSync(`${target}/manifest.json`, 'utf8'));
manifest.name = `Angular Mask for ${name}`;
manifest.content_scripts.forEach((script) => (script.matches = urls));
manifest.web_accessible_resources.forEach((resource) => (resource.matches = urls));
manifest.host_permissions = urls;
writeFileSync(`${target}/manifest.json`, JSON.stringify(manifest, null, 2));

const rules = JSON.parse(readFileSync(`${target}/rules.json`, 'utf8'));
rules.forEach((rule) => {
  rule.condition.domains = domains;
  rule.action.redirect.transform.port = `${port}`;
});
writeFileSync(`${target}/rules.json`, JSON.stringify(rules, null, 2));
