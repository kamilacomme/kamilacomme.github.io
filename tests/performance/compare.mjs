import fs from 'node:fs/promises';
const [baselineFile='tests/baseline/performance/summary.json',candidateFile='test-results/performance/summary.json']=process.argv.slice(2);
const [baseline,candidate]=await Promise.all([baselineFile,candidateFile].map(async p=>JSON.parse(await fs.readFile(p,'utf8'))));
const failures=[];
const versionSignature=run=>JSON.stringify({lighthouseVersion:run.lighthouseVersion,browserVersion:run.browserVersion,userAgent:run.userAgent});
const referenceSignature=versionSignature(baseline.measurements?.[0]||{});
const referenceSettings=Object.fromEntries(['mobile','desktop'].map(profile=>[profile,baseline.measurements?.find(row=>row.profile===profile)?.configSettings]));
for(const [name,summary] of [['baseline',baseline],['candidate',candidate]]){
 if(summary.diagnostic||summary.status!=='complete')failures.push(`${name}: diagnostic or incomplete measurement set`);
 if(summary.aggregate?.length!==4||summary.measurements?.length<12)failures.push(`${name}: all four targets with at least three runs are required`);
 for(const locale of ['fr','en'])for(const profile of ['mobile','desktop']){
  const rows=summary.measurements?.filter(m=>m.locale===locale&&m.profile===profile)||[];
  if(new Set(rows.map(row=>row.iteration)).size<3)failures.push(`${name}: fewer than three distinct ${locale}/${profile} iterations`);
  if(rows.length<3)failures.push(`${name}: insufficient ${locale}/${profile} measurements`);
  for(const row of rows){
   if(versionSignature(row)!==referenceSignature)failures.push(`${name}/${row.id}: browser/Lighthouse version differs`);
   if(JSON.stringify(row.configSettings)!==JSON.stringify(referenceSettings[profile]))failures.push(`${name}/${row.id}: actual Lighthouse settings differ for ${profile}`);
   for(const key of ['score','fcpMs','lcpMs','tbtMs','cls','speedIndexMs','totalByteWeight'])if(!Number.isFinite(row[key]))failures.push(`${name}/${row.id}: invalid ${key}`);
   if(!row.auditedReadiness?.curtainTextureLoaded||!row.auditedReadiness?.requiredFontsLoaded||row.auditPageErrors?.length||row.auditConsoleErrors?.length||row.auditedResourceErrors?.length)failures.push(`${name}/${row.id}: failed audited rendering health`);
  }
 }
}
if(failures.length){console.error(JSON.stringify({status:'failed',failures},null,2));process.exit(1);}
if(baseline.servedSourceVerification?.status!=='passed') failures.push('Baseline has no verified original served-source provenance.');
if(baseline.referenceCommit!==candidate.referenceCommit) failures.push('Original reference commits differ.');
if(!/^[a-f0-9]{64}$/.test(baseline.runtimeManifestSha256||'')) failures.push('Baseline runtime fingerprint is invalid.');
if (baseline.runtimeManifestSha256!==candidate.runtimeManifestSha256) failures.push('Runtime dependency fixture fingerprint differs; comparison is invalid.');
if(!/^[a-f0-9]{64}$/.test(baseline.serverSha256||'')||baseline.serverSha256!==candidate.serverSha256) failures.push('Static server fingerprint differs; comparison is invalid.');
if (baseline.mode!==candidate.mode) failures.push('Measurement modes differ.');
if(JSON.stringify(baseline.measurementSettings)!==JSON.stringify(candidate.measurementSettings)) failures.push('Lighthouse measurement settings differ; comparison is invalid.');
if(JSON.stringify(baseline.profiles)!==JSON.stringify(candidate.profiles)) failures.push('Lighthouse profile settings differ; comparison is invalid.');
if(JSON.stringify(baseline.launcherDefaultFlags)!==JSON.stringify(candidate.launcherDefaultFlags)) failures.push('Launcher default flags differ; comparison is invalid.');
if(JSON.stringify(baseline.chromeFlags)!==JSON.stringify(candidate.chromeFlags)) failures.push('Chrome flags differ; comparison is invalid.');
for(const b of baseline.aggregate){
 if(!['score','fcpMs','lcpMs','tbtMs','cls','speedIndexMs','totalByteWeight'].every(metric=>Number.isFinite(b[metric]))){failures.push(`${b.locale}/${b.profile}: invalid baseline medians`);continue;}
 const c=candidate.aggregate.find(x=>x.locale===b.locale&&x.profile===b.profile);
 if(!c){failures.push(`Missing target ${b.locale}/${b.profile}`);continue;}
 if(!Number.isFinite(c.score)||!Number.isFinite(c.runs)){failures.push(`${b.locale}/${b.profile}: invalid candidate summary`);continue;}
 if(c.runs<3){failures.push(`${b.locale}/${b.profile}: fewer than three runs`);continue;}
 for(const [metric,relative,absolute] of [['fcpMs',.15,100],['lcpMs',.15,250],['tbtMs',.20,100],['speedIndexMs',.15,250],['cls',0,.02]]){
  if(!Number.isFinite(c[metric])){failures.push(`${b.locale}/${b.profile}: missing ${metric}`);continue;}
  const ceiling=b[metric]+Math.max(b[metric]*relative,absolute);
  if(c[metric]>ceiling) failures.push(`${b.locale}/${b.profile} ${metric}: ${c[metric]} exceeds ${ceiling} (baseline ${b[metric]})`);
 }
 if(c.score<b.score-5) failures.push(`${b.locale}/${b.profile}: median score fell from ${b.score} to ${c.score}`);
 if(c.scoreRange[1]-c.scoreRange[0]>10) console.warn(`${b.locale}/${b.profile}: score spread >10; investigate measurement instability.`);
}
console.log(JSON.stringify({status:failures.length?'failed':'passed',baselineFile,candidateFile,failures},null,2));
if(failures.length)process.exitCode=1;
