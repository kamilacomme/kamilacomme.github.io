const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function manifest() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  for (const [url, resource] of Object.entries(data.resources)) {
    const bytes = fs.readFileSync(path.join(__dirname, resource.file));
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== resource.sha256) {
      throw new Error(`Runtime fixture integrity mismatch: ${url}`);
    }
    if (resource.sri && `sha384-${crypto.createHash('sha384').update(bytes).digest('base64')}` !== resource.sri) {
      throw new Error(`Original SRI mismatch: ${url}`);
    }
  }
  return data;
}

async function installRuntimeReplay(context) {
  const data = manifest();
  await context.route('https://**/*', async route => {
    const url = route.request().url();
    const parsed = new URL(url);
    if (['www.googletagmanager.com', 'www.google-analytics.com', 'region1.google-analytics.com'].includes(parsed.hostname)) {
      // Lab isolation only: do not send analytics/contact events from tests.
      return route.fulfill({status: 200, contentType: 'text/javascript', body: '/* Analytics isolated in regression lab. */', headers: {'access-control-allow-origin': '*'}});
    }
    const resource = data.resources[url];
    if (!resource) {
      console.error(`UNFROZEN_EXTERNAL_RESOURCE ${url}`);
      return route.abort('blockedbyclient');
    }
    return route.fulfill({status: 200, contentType: resource.contentType,
      body: fs.readFileSync(path.join(__dirname, resource.file)),
      headers: {'access-control-allow-origin': '*', 'cache-control': 'public, max-age=31536000'}});
  });
  return data;
}

module.exports = { installRuntimeReplay, installRuntimeRoutes: installRuntimeReplay, manifest };
