// Generates WebP images for one case from its source frames (read only).
// Only frames used in content/cases/<id>.json are converted; the source of each
// frame is listed in content/cases/<id>.sources.json.
//
// Usage: npm run case:images -- <case-id> [--source=<folder>] [--check]
//   --source  folder with the original frames (default ~/Downloads/Jane for jane)
//   --check   list what would be written and the expected total, write nothing
//
// Output: assets/cases/<id>/<name>-<width>.webp for each width in IMAGE_WIDTHS
// that is not wider than the source, plus the source width itself when it is
// more than 10% wider than the largest step reached (never upscaled), and assets/cases/<id>/images.json
// with the widths and intrinsic size of every image (used by the page builder).
import { readFile, writeFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { root } from './case-data.mjs';
import { IMAGE_WIDTHS, imageNames, validateCaseFormat } from './validate-case-data.mjs';

const QUALITY = 80;
const args = process.argv.slice(2);
const id = args.find(arg => !arg.startsWith('--'));
const sourceArg = args.find(arg => arg.startsWith('--source='));
const checkOnly = args.includes('--check');
if (!id) { console.error('Usage: npm run case:images -- <case-id> [--source=<folder>] [--check]'); process.exit(2); }

const data = JSON.parse(await readFile(path.join(root, 'content/cases', `${id}.json`), 'utf8'));
const structural = validateCaseFormat(data, { id });
if (structural.length) throw new Error(`Case file is invalid:\n- ${structural.join('\n- ')}`);
const sources = JSON.parse(await readFile(path.join(root, 'content/cases', `${id}.sources.json`), 'utf8')).images;
const sourceRoot = sourceArg ? path.resolve(sourceArg.slice('--source='.length).replace(/^~/, os.homedir()))
  : path.join(os.homedir(), 'Downloads', id === 'jane' ? 'Jane' : id);

const used = [...new Set(imageNames(data).map(([name]) => name))].sort();
const missing = used.filter(name => !sources[name]);
if (missing.length) throw new Error(`No source frame listed in ${id}.sources.json for: ${missing.join(', ')}`);
const unused = Object.keys(sources).filter(name => !used.includes(name));
if (unused.length) throw new Error(`Listed in ${id}.sources.json but not used in the case (not converted): ${unused.join(', ')}`);

export function widthsFor(sourceWidth) {
  const steps = IMAGE_WIDTHS.filter(width => width <= sourceWidth);
  const largest = Math.max(...IMAGE_WIDTHS);
  if (sourceWidth < IMAGE_WIDTHS[0]) return [sourceWidth];
  // Keep the full source width when it is clearly (over 10%) wider than the largest step it reached.
  if (sourceWidth > steps.at(-1) * 1.1 && sourceWidth < largest) steps.push(sourceWidth);
  return steps;
}

const outDir = path.join(root, 'assets/cases', id);
if (!checkOnly) await mkdir(outDir, { recursive: true });
const manifest = {};
const written = new Set(['images.json']);
let total = 0;
for (const name of used) {
  const file = path.join(sourceRoot, sources[name]);
  const meta = await sharp(file).rotate().metadata();
  const width = meta.autoOrient?.width ?? meta.width, height = meta.autoOrient?.height ?? meta.height;
  const widths = widthsFor(width);
  manifest[name] = { width, height, widths };
  for (const w of widths) {
    const out = `${name}-${w}.webp`;
    written.add(out);
    if (checkOnly) continue;
    const info = await sharp(file).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 6 }).toFile(path.join(outDir, out));
    total += info.size;
  }
}
if (checkOnly) {
  console.log(`${used.length} frames, ${written.size - 1} files would be written to assets/cases/${id}/ (sources: ${sourceRoot}).`);
  process.exit(0);
}
await writeFile(path.join(outDir, 'images.json'), `${JSON.stringify({ schemaVersion: 1, quality: QUALITY, images: manifest }, null, 2)}\n`);
// Remove WebP files of frames that are no longer assigned (only generated files in this folder).
for (const entry of await readdir(outDir)) if (entry.endsWith('.webp') && !written.has(entry)) await rm(path.join(outDir, entry));
total += (await stat(path.join(outDir, 'images.json'))).size;
console.log(`${used.length} frames → ${written.size - 1} WebP files in assets/cases/${id}/, ${(total / 1024 / 1024).toFixed(2)} MB.`);
