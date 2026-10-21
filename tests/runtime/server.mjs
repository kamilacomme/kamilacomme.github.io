/** Local byte-identical website server with HTTP Range support for MP4 seeking. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const port=Number(process.env.PORT||8000);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp4':'video/mp4','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};

http.createServer((request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  let pathname;
  try{pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);}catch{response.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  let stat;
  try{stat=fs.statSync(file);if(stat.isDirectory()){file=path.join(file,'index.html');stat=fs.statSync(file);}}catch{response.writeHead(404).end();return;}
  if(!stat.isFile()){response.writeHead(404).end();return;}
  const headers={'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
  let start=0,end=stat.size-1,status=200;
  if(request.headers.range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if(!match||(!match[1]&&!match[2])){response.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    if(!match[1]){const suffix=Number(match[2]);start=Math.max(0,stat.size-suffix);}
    else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
    if(start>end||start>=stat.size){response.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length']=end-start+1;
  response.writeHead(status,headers);
  if(request.method==='HEAD'){response.end();return;}
  fs.createReadStream(file,{start,end}).pipe(response);
}).listen(port,'127.0.0.1',()=>console.log(`Portfolio test server: http://127.0.0.1:${port} (${root})`));
