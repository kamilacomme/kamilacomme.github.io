import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function fixture(){
  const metrics={score:90,fcpMs:1000,lcpMs:1500,tbtMs:100,cls:0,speedIndexMs:1200,totalByteWeight:100000};
  const aggregate=[];const measurements=[];
  for(const locale of ['fr','en']) for(const profile of ['mobile','desktop']){
    aggregate.push({locale,profile,runs:3,scoreRange:[90,90],...metrics});
    for(let iteration=1;iteration<=3;iteration++) measurements.push({id:`${locale}-${profile}-${iteration}`,locale,profile,iteration,lighthouseVersion:'13.5.0',userAgent:'Synthetic gate fixture',...metrics,auditedReadiness:{curtainTextureLoaded:true,requiredFontsLoaded:true},auditPageErrors:[],auditedResourceErrors:[]});
  }
  return {schemaVersion:1,status:'complete',diagnostic:false,mode:'controlled-local-runtime-replay',referenceCommit:'synthetic-original',servedSourceVerification:{status:'passed'},runtimeManifestSha256:'a'.repeat(64),profiles:{mobile:{},desktop:{}},measurementSettings:{cpuQuietThresholdMs:0},chromeFlags:[],launcherDefaultFlags:[],aggregate,measurements};
}
async function run(candidate,baseline=fixture()){
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-performance-gate-'));
  try{
    const baseFile=path.join(temporary,'baseline.json'),candidateFile=path.join(temporary,'candidate.json');
    await fs.writeFile(baseFile,JSON.stringify(baseline));await fs.writeFile(candidateFile,JSON.stringify(candidate));
    const result=spawnSync(process.execPath,['tests/performance/compare.mjs',baseFile,candidateFile],{encoding:'utf8'});
    return {status:result.status,output:result.stdout+result.stderr};
  }finally{await fs.rm(temporary,{recursive:true,force:true});}
}
test('identical complete synthetic measurements pass',async()=>assert.equal((await run(fixture())).status,0));
test('diagnostic output cannot serve as a baseline',async()=>{const b=fixture();b.diagnostic=true;assert.equal((await run(fixture(),b)).status,1);});
test('missing target fails rather than passing a partial result',async()=>{const c=fixture();c.measurements=c.measurements.filter(m=>m.locale!=='en');assert.equal((await run(c)).status,1);});
test('nonfinite metrics fail',async()=>{const c=fixture();c.measurements[0].lcpMs=NaN;assert.equal((await run(c)).status,1);});
test('runtime dependency mismatch invalidates comparison',async()=>{const c=fixture();c.runtimeManifestSha256='different';assert.equal((await run(c)).status,1);});
test('material LCP regression fails',async()=>{const c=fixture();for(const m of c.measurements)m.lcpMs=2500;for(const m of c.aggregate)m.lcpMs=2500;const result=await run(c);assert.equal(result.status,1);assert.match(result.output,/lcpMs/);});
test('required resource failure invalidates measurement',async()=>{const c=fixture();c.measurements[0].auditedResourceErrors=[{url:'https://example.test/font.woff2',error:'blockedbyclient'}];assert.equal((await run(c)).status,1);});

test('version drift in a later measurement cannot hide behind first-row equality',async()=>{const c=fixture();c.measurements[11].lighthouseVersion='different';assert.equal((await run(c)).status,1);});
test('actual settings drift in a later measurement fails',async()=>{const c=fixture();c.measurements[10].configSettings={cpuQuietThresholdMs:9000};assert.equal((await run(c)).status,1);});

test('caught animation failures logged to console invalidate measurement',async()=>{const c=fixture();c.measurements[0].auditConsoleErrors=[{text:'frame failed'}];assert.equal((await run(c)).status,1);});
