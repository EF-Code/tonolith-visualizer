import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite']);
const credential = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|xprv[0-9A-Za-z]+|xpub[0-9A-Za-z]+|ghp_[0-9A-Za-z]{20,}|sk-[0-9A-Za-z]{20,})/;
const matches = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name === 'check-secrets.mjs') continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(fullPath);
      continue;
    }
    const text = await readFile(fullPath, 'utf8');
    if (credential.test(text)) matches.push(relative('.', fullPath));
  }
}

await visit('.');
if (matches.length > 0) {
  console.error('secrets: suspicious credential material found in ' + matches.join(', '));
  process.exit(1);
}
console.log('secrets: no credential patterns found');
