import fs from 'node:fs/promises';
import path from 'node:path';

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function relative(file, root) {
  return path.relative(root, file).split(path.sep).join('/');
}

function collectTests(report) {
  const tests = [];
  function visit(node) {
    for (const spec of node.specs || []) for (const test of spec.tests || []) {
      for (const result of test.results || []) tests.push({ spec, test, result });
    }
    for (const suite of node.suites || []) visit(suite);
  }
  for (const suite of report.suites || []) visit(suite);
  return tests;
}

function statusCounts(report) {
  const counts = { passed: 0, failed: 0, skipped: 0, timedOut: 0, interrupted: 0 };
  for (const { result } of collectTests(report)) {
    if (result.status === 'passed') counts.passed += 1;
    else if (result.status === 'failed') counts.failed += 1;
    else if (result.status === 'skipped') counts.skipped += 1;
    else if (result.status === 'timedOut') counts.timedOut += 1;
    else if (result.status === 'interrupted') counts.interrupted += 1;
  }
  return counts;
}

async function attachmentJson(result, title) {
  const attachments = [...(result.attachments || [])].sort((a, b) => {
    const preferred = title.startsWith('resizing preserves') ? 'project-scroll-preservation'
      : title.includes('all six projects') ? 'project-reachability-measurements' : null;
    return Number(b.name?.includes(preferred)) - Number(a.name?.includes(preferred));
  });
  for (const attachment of attachments) {
    if (attachment.contentType !== 'application/json' || !attachment.path) continue;
    try { return { file: attachment.path, data: JSON.parse(await fs.readFile(attachment.path, 'utf8')) }; } catch { /* keep looking */ }
  }
  return null;
}

function viewportOf(data) {
  return data?.requestedViewport || data?.viewport || data?.failures?.[0]?.viewport || data?.records?.at(-1)?.viewport || null;
}

async function createReport(root) {
  const files = await walk(root);
  const records = [];
  for (const file of files.filter(candidate => candidate.includes('/test-results/') && candidate.endsWith('.json') && !candidate.endsWith('/results.json'))) {
    try {
      const data = JSON.parse(await fs.readFile(file, 'utf8'));
      if (data.requestedViewport && data.profile) records.push({ file, data });
    } catch { /* Playwright has other JSON output alongside measurements. */ }
  }

  let resultReport = null;
  try { resultReport = JSON.parse(await fs.readFile(path.join(root, 'results.json'), 'utf8')); } catch {}
  const tests = resultReport ? collectTests(resultReport) : [];
  const failures = [];
  for (const entry of tests.filter(item => item.result.status === 'failed')) {
    const attached = await attachmentJson(entry.result, entry.spec.title);
    const data = attached?.data || {};
    const knownDeferred = entry.spec.title.includes('short-height project reachability');
    if (knownDeferred) continue; // Detailed deferred findings are listed per probe below.
    const resize = entry.spec.title.startsWith('resizing preserves');
    failures.push({
      classification: knownDeferred ? 'Known deferred issue (M10B)' : 'Confirmed functional or geometry failure',
      severity: knownDeferred ? 'deferred' : 'high',
      title: entry.spec.title,
      project: entry.test.projectName,
      viewport: viewportOf(data),
      language: data.language || entry.test.projectName?.split('-').at(-1) || 'unknown',
      profile: data.profile?.mode || data.actualProfile?.mode || data.failures?.[0]?.actualProfile?.mode || entry.test.projectName?.replace(/-(fr|en)$/, '') || 'unknown',
      owner: data.owner || (resize
        ? `existing ${data.failures?.[0]?.actualProfile?.mode || entry.test.projectName?.replace(/-(fr|en)$/, '')} project scroll and responsive geometry owners`
        : 'existing responsive behavior measured by this assertion'),
      evidence: data.failures?.length
        ? `${data.failures[0].priorProject?.name || 'prior project'} → ${data.failures[0].currentProject?.name || 'no project visible'}`
        : data.unreachable?.length
          ? `unreachable project indices ${data.unreachable.map(item => item.index).join(', ')}; missing links=${data.missingLinks?.length || 0}`
          : entry.result.errors?.[0]?.message?.split('\n').find(line => /whole ticket|About|profile|overflow|Expected:|Received:/.test(line))?.trim() || entry.spec.title,
      attachment: attached?.file || null,
    });
  }

  const derived = [];
  for (const { file, data } of records) for (const finding of data.findings || []) {
    if (finding.classification === 'visual review required') continue;
    derived.push({ finding, file, data });
  }
  const deferredByViewport = new Map();
  for (const file of files.filter(candidate => candidate.includes('/test-results/') && candidate.endsWith('.json') && !candidate.endsWith('/results.json'))) {
    try {
      const data = JSON.parse(await fs.readFile(file, 'utf8'));
      if (data.fullTicketReachability === false) {
        const key = `${data.viewport.width}x${data.viewport.height}-${data.language}`;
        if (!deferredByViewport.has(key)) deferredByViewport.set(key, { file, data });
      }
    } catch {}
  }

  const meta = JSON.parse(await fs.readFile(path.join(root, 'run-meta.json'), 'utf8').catch(() => '{}'));
  const counts = resultReport ? statusCounts(resultReport) : null;
  const output = [
    '# Responsive QA baseline report', '',
    `Run: ${meta.runId || path.basename(root)} · commit: ${meta.commit || 'unrecorded'} · Chromium: ${meta.chromium || 'configured Playwright Chromium'} · elapsed: ${meta.elapsedSeconds ?? 'unknown'}s`, '',
    'The run used the existing Phase 5 Chromium projects, CDN replay routes and runtime server. All output is isolated under this ignored responsive-QA run directory; approved screenshot references were not read or written.', '',
  ];
  if (counts) output.push(`Playwright: ${counts.passed} passed · ${counts.failed} failed · ${counts.skipped} skipped · ${counts.timedOut} timed out · 1 worker.`, '');

  output.push('## Findings', '');
  if (!failures.length && !derived.length) output.push('No automated failure was classified. Captures still require human visual review; automated checks do not grant visual approval.', '');
  for (const [index, item] of failures.entries()) {
    const viewport = item.viewport ? `${item.viewport.width}×${item.viewport.height}` : 'viewport recorded in attached test evidence';
    const link = item.attachment ? `[measurements](${relative(item.attachment, root)})` : 'Playwright error context and trace in the test-results folder';
    output.push(`${index + 1}. **${item.classification}** · ${item.severity} · ${viewport} · ${item.language} · actual profile ${item.profile} · owner: ${item.owner}`);
    output.push(`   ${item.title}; ${item.evidence} · ${link}`);
  }
  for (const [index, { finding, file, data }] of derived.entries()) {
    const viewport = viewportOf(data);
    output.push(`${failures.length + index + 1}. **${finding.classification}** · ${finding.severity} · ${viewport ? `${viewport.width}×${viewport.height}` : 'viewport not recorded'} · ${data.language} · actual profile ${data.profile?.mode || 'not recorded'} · owner: ${finding.owner}`);
    output.push(`   ${finding.evidence} · [measurements](${relative(file, root)})`);
  }
  for (const [index, { file, data }] of [...deferredByViewport.values()].entries()) {
    output.push(`${failures.length + derived.length + index + 1}. **Known deferred issue (M10B)** · high · ${data.viewport.width}×${data.viewport.height} · ${data.language} · actual profile ${data.actualProfile?.mode || 'desktop'} · owner: ${data.owner}`);
    output.push(`   ${data.horizontallyReachableIndices?.length ?? 0}/6 cards reach the horizontal endpoint; ${data.fullyReachableIndices?.length ?? 0}/6 tickets are fully visible; ticket exceeds available rail height=${data.ticketExceedsViewportHeight} · [measurements](${relative(file, root)})`);
    const shots = data.observations || [];
    for (const shot of shots) {
      const imageName = `${data.language}-${data.id}-scroll-${shot.index}.png`;
      const imagePath = files.find(candidate => candidate.endsWith(`/${imageName}`)) || path.resolve(path.dirname(file), '..', imageName);
      output.push(`   - Scroll step ${shot.index}: ${shot.visible?.length ?? 0} full tickets visible · [capture](${relative(imagePath, root)})`);
    }
  }

  output.push('', '## Captures for visual review', '');
  const screenshots = records.filter(({ data }) => data.classification === 'routine' || data.classification === 'resilience-probe');
  const unique = new Map();
  for (const record of screenshots) {
    const { data, file } = record;
    const key = `${data.requestedViewport.width}x${data.requestedViewport.height}-${data.language}-${data.profile.mode}`;
    if (!unique.has(key)) unique.set(key, record);
  }
  for (const { data, file } of unique.values()) {
    const viewport = data.requestedViewport;
    const capturePrefix = path.basename(file).replace(/-measurements-[a-f0-9]+\.json$/, '');
    const siblingCapture = path.resolve(path.dirname(file), '..', `${capturePrefix}.png`);
    const screenshot = data.screenshotPath || (files.includes(siblingCapture) ? siblingCapture : null);
    const screenshotLink = screenshot ? `[browser capture](${relative(screenshot, root)})` : '[capture in Playwright attachments](html-report/index.html)';
    const kind = data.classification === 'resilience-probe' ? 'resilience probe; not a visual-baseline target' : 'routine visual review required';
    output.push(`- ${viewport.width}×${viewport.height} · ${data.language} · ${data.profile.mode} (${data.profile.detection.coarsePointer ? 'coarse/touch' : 'fine/pointer'} profile) · ${kind} · ${screenshotLink} · [metrics](${relative(file, root)})`);
  }

  output.push('', '## Intentional and deferred behavior', '',
    '- **Intentional/approved:** horizontal project rails may show neighboring tickets clipped at the viewport edge; checks track whether every whole ticket can be reached. This does not classify all clipping as a defect.',
    '- **Known deferred Projects issue:** the existing desktop rail can clip ticket height or lose end reachability in short-height probes. This remains an active failing assertion assigned to M10B; no fallback was implemented.',
    '- **Visual review required:** captures are evidence only. They are not compared against or written into historical references, and they do not imply visual approval.',
    '');
  const reportPath = path.join(root, 'summary.md');
  await fs.writeFile(reportPath, output.join('\n'));
  return reportPath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const root = path.resolve(process.argv[2] || 'artifacts/playwright/responsive-qa/latest');
  process.stdout.write(`${await createReport(root)}\n`);
}

export { createReport };
