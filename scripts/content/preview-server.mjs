import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.resolve(process.env.PHASE4_PREVIEW_OUT || path.join(root, 'dist/phase4-preview'));
const port = Number(process.env.PORT || 8001);
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp4':'video/mp4','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2' };
const generated = new Map([
  ['/','index.html'], ['/index.html','index.html'], ['/desktop-project-embedded.html','desktop-project-embedded.html'],
  ['/en','en/index.html'], ['/en/','en/index.html'], ['/en/index.html','en/index.html'], ['/en/desktop-project-embedded.html','en/desktop-project-embedded.html'],
]);

http.createServer((request, response) => {
  if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405,{Allow:'GET, HEAD'}).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname); }
  catch { response.writeHead(400).end(); return; }
  const file = generated.has(pathname) ? path.resolve(output, generated.get(pathname)) : path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep) && !file.startsWith(output + path.sep)) { response.writeHead(403).end(); return; }
  let stat;
  try { stat = fs.statSync(file); if (stat.isDirectory()) { response.writeHead(404).end(); return; } }
  catch { response.writeHead(404).end(); return; }
  const headers = { 'Content-Type':types[path.extname(file).toLowerCase()] || 'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store' };
  let start=0,end=stat.size-1,status=200;
  if (request.headers.range) {
    const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1]&&!match[2])) { response.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end(); return; }
    if (!match[1]) start=Math.max(0,stat.size-Number(match[2])); else { start=Number(match[1]); if(match[2]) end=Math.min(end,Number(match[2])); }
    if (start>end || start>=stat.size) { response.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end(); return; }
    status=206; headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length']=end-start+1; response.writeHead(status,headers);
  if (request.method==='HEAD') { response.end(); return; }
  fs.createReadStream(file,{start,end}).pipe(response);
}).listen(port,'127.0.0.1',()=>console.log(`Phase 4 preview: http://127.0.0.1:${port}/`));
