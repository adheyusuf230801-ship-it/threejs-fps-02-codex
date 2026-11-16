// Deterministic static hand-in. Invalid or missing captures fail validation.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-threejs.ts';
const source = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(output, { recursive: true });
for (const name of ['game', 'screenshots']) {
  mkdirSync(join(output, name), { recursive: true });
  if (existsSync(join(source, name))) cpSync(join(source, name), join(output, name), { recursive: true });
}
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};
const dossier = buildDossier(output, caps);
writeFileSync(join(output, 'dossier.json'), dossier);
