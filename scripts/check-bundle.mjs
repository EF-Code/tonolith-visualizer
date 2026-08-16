import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const assetDir = 'dist/assets';
const entries = await readdir(assetDir, { withFileTypes: true });
let javascriptBytes = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
  javascriptBytes += (await stat(join(assetDir, entry.name))).size;
}

const budget = 750_000;
console.log('bundle: JavaScript bytes ' + javascriptBytes + ' / ' + budget);
if (javascriptBytes > budget) {
  console.error('bundle: JavaScript budget exceeded');
  process.exit(1);
}

