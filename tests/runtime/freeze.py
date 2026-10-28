#!/usr/bin/env python3
"""Freeze original HTTPS dependency responses without editing application files.

Curl keeps normal certificate verification; React's existing SRI is checked.
Run only when deliberately refreshing dependency fixtures, never in the gate.
"""
import base64
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36'
resources = {}
existing = OUT / 'manifest.json'
if existing.exists():
    resources = json.loads(existing.read_text())['resources']

def fetch(url, mime=None, sri=None):
    if url in resources:
        data = (OUT / resources[url]['file']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == resources[url]['sha256']
        return data.decode() if mime and ('javascript' in mime or 'css' in mime) else ''
    key = hashlib.sha256(url.encode()).hexdigest()[:24]
    suffix = '.css' if mime == 'text/css' else '.js' if mime == 'text/javascript' else '.bin'
    target = OUT / 'resources' / (key + suffix)
    target.parent.mkdir(exist_ok=True)
    subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location',
                    '--proto', '=https', '--max-time', '60', '--user-agent', UA,
                    url, '--output', str(target)], check=True)
    data = target.read_bytes()
    if sri:
        assert 'sha384-' + base64.b64encode(hashlib.sha384(data).digest()).decode() == sri, url
    resources[url] = {'file': str(target.relative_to(OUT)), 'sha256': hashlib.sha256(data).hexdigest(),
                      'bytes': len(data), 'contentType': mime or 'font/woff2', 'source': url,
                      **({'sri': sri} if sri else {})}
    print(url, len(data), flush=True)
    save()
    return data.decode() if mime and ('javascript' in mime or 'css' in mime) else ''

def save():
    existing.write_text(json.dumps({'schemaVersion': 1, 'userAgent': UA,
       'policy': 'Original HTTPS responses, TLS verified by curl; no CDN substitutions. Replay preserves original request URLs and React SRI.',
       'resources': resources}, indent=2) + '\n')

support = (ROOT / 'support.js').read_text()
for name in ['REACT', 'REACT_DOM']:
    url = re.search(r'var ' + name + r'_URL = "([^"]+)"', support)[1]
    sri = re.search(r'var ' + name + r'_SRI = "([^"]+)"', support)[1]
    fetch(url, 'text/javascript', sri)
urls = set()
for p in [ROOT / 'index.html', ROOT / 'desktop-project-embedded.html', *ROOT.glob('_ds/**/fonts.css')]:
    for url in re.findall(r'https://fonts\.googleapis\.com/css2[^"\x27<>\s]+', p.read_text()):
        urls.add(url.replace('&amp;', '&'))
for url in sorted(urls):
    css = fetch(url, 'text/css')
    for font in re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css):
        fetch(font)

def esm(url):
    code = fetch(url, 'text/javascript')
    for specifier in re.findall(r'(?:from\s*|import\s*)["\x27]([^"\x27]+)["\x27]', code):
        if specifier.startswith('/'):
            esm('https://esm.sh' + specifier)
        elif specifier.startswith('https://esm.sh/'):
            esm(specifier)

esm('https://esm.sh/three@0.160.0')
save()
print('All required runtime fixtures frozen with verified TLS.')
