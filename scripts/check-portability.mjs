import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite']);
const absolutePathMarkers = ['/home/', '/Users/', 'C:\\\\', '/mnt/'];
const matches = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name === 'check-portability.mjs') continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(fullPath);
      continue;
    }
    const text = await readFile(fullPath, 'utf8');
    if (absolutePathMarkers.some((marker) => text.includes(marker))) matches.push(relative('.', fullPath));
  }
}

await visit('.');
if (matches.length > 0) {
  console.error('portability: machine-specific paths found in ' + matches.join(', '));
  process.exit(1);
}
console.log('portability: no machine-specific paths found');
