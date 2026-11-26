// HomeLedger — "Make the best household budget site" (Node 22, stdlib only).
// The site is this directory's app/ folder: plain static files a browser opens
// at app/index.html (ES modules, CSS, no build step), its figures held in its
// own files, nothing loaded over the network. This program hands the site in:
// it copies app/ and screenshots/ from beside this file into the output
// directory and writes output/dossier.json with the vendored make.fun
// library, which the scorer re-runs and compares byte for byte — so leave
// vendor/makefun-frontend.ts exactly as the kit shipped it.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the site locally first with `node serve.ts`, then open
// http://localhost:8080 and look at it on a desktop and a phone width.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits (see the kit's RULES.txt): at most
// 4 screenshots of 256 KiB each, at most 993 files and directories in app/
// totalling 16 MiB, and the dossier text capped at 160 KiB.
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

// Say what was handed in, and refuse to look finished when a piece is
// missing: a run that copied nothing useful should fail loudly here, in
// development, instead of passing quietly and failing at the gate.
const appFiles = readdirSync(join(out, 'app'));
const shotFiles = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')) : [];
if (!appFiles.includes('index.html')) throw new Error('app/index.html is missing from the output');
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}
console.log(
  `HomeLedger handed in: ${appFiles.length} files in app/, ${shotFiles.length} screenshots, ` +
    `dossier ${statSync(dossierPath).size} bytes -> ${out}`,
);
