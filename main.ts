// main.ts — writes the front-page image to the output directory.
// The image is pre-rendered by generate.mjs and stored as entry.png next
// to this file; this program only copies it, so repeated runs produce
// byte-identical output. Node 22 stdlib only, no network.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(outDir, { recursive: true });

const src = join(here, 'entry.png');
if (!existsSync(src)) {
  throw new Error('entry.png is missing next to main.ts');
}
copyFileSync(src, join(outDir, 'entry.png'));
const dst = join(outDir, 'entry.png');
if (statSync(src).size !== statSync(dst).size) {
  throw new Error('copied entry.png has an unexpected size');
}
console.log('wrote ' + dst);
