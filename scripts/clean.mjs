import { rm } from 'node:fs/promises';

for (const target of ['dist', 'coverage', '.vite']) {
  await rm(target, { recursive: true, force: true });
}

console.log('clean: generated directories removed');
