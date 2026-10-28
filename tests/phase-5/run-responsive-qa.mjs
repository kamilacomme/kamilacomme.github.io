import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReport } from './responsive-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const runId = `${stamp}-${process.pid}`;
const out = path.join(root, 'artifacts/playwright/responsive-qa', runId);
await fs.mkdir(out, { recursive: true });

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, ...options });
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code: code ?? 1, signal }));
  });
}

const port = await getFreePort();
const baseURL = `http://127.0.0.1:${port}`;
const serverLog = await fs.open(path.join(out, 'server.log'), 'w');
const server = spawn(process.execPath, ['tests/runtime/server.mjs'], {
  cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', chunk => serverLog.write(chunk));
server.stderr.on('data', chunk => serverLog.write(chunk));

let ready = false;
for (let attempt = 0; attempt < 80; attempt += 1) {
  if (server.exitCode !== null) break;
  try {
    const response = await fetch(baseURL);
    if (response.ok) { ready = true; break; }
  } catch { /* the local server is still starting */ }
  await new Promise(resolve => setTimeout(resolve, 100));
}

if (!ready) {
  server.kill('SIGTERM');
  await serverLog.close();
  throw new Error(`Responsive QA server did not become ready at ${baseURL}; see ${path.join(out, 'server.log')}`);
}

const started = Date.now();
let testRun = { code: 1, signal: null };
try {
  const cli = path.join(root, 'node_modules/@playwright/test/cli.js');
  const args = [
    cli,
    'test',
    '--config', 'tests/phase-5/playwright.config.cjs',
    '--output', path.join(out, 'test-results'),
    '--reporter=list,json,html',
    'tests/phase-5/responsive-geometry.spec.cjs',
    'tests/phase-5/responsive-interactions.spec.cjs',
    'tests/phase-5/responsive-resize.spec.cjs',
  ];
  const log = await fs.open(path.join(out, 'playwright.log'), 'w');
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: {
      ...process.env,
      BASE_URL: baseURL,
      PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(out, 'results.json'),
      PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(out, 'html-report'),
      PLAYWRIGHT_HTML_OPEN: 'never',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
    process.stdout.write(chunk);
    log.write(chunk);
  });
  testRun = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code: code ?? 1, signal }));
  });
  await log.close();
} finally {
  const elapsedSeconds = Math.round((Date.now() - started) / 1000);
  let chromium = 'unknown';
  try { chromium = execFileSync(process.env.CHROMIUM_PATH || '/usr/bin/chromium', ['--version'], { encoding: 'utf8' }).trim(); } catch {}
  let commit = 'unknown';
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
  await fs.writeFile(path.join(out, 'run-meta.json'), JSON.stringify({ runId, port, baseURL, commit, chromium, startedAt: new Date(started).toISOString(), elapsedSeconds, exitCode: testRun.code, signal: testRun.signal }, null, 2));
  try { await createReport(out); } catch (error) { await fs.writeFile(path.join(out, 'report-error.txt'), String(error.stack || error)); }
  server.kill('SIGTERM');
  await serverLog.close();
}

process.stdout.write(`Responsive QA artifacts: ${out}\n`);
if (testRun.code !== 0) process.exitCode = testRun.code;
