import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const overlay=path.join(root,'tests/phase-4/references');
const phase3=path.join(root,'tests/phase-3/references');
const lockPath=path.join(root,'tests/phase-4/reference-lock.json');
const profiles=['desktop-fr','desktop-en','tablet-portrait-fr','tablet-portrait-en','tablet-landscape-fr','tablet-landscape-en','mobile-fr','mobile-en'];
const changedProfiles=profiles.filter(profile=>profile.startsWith('tablet-'));
const stateFiles=['projects-start.png','projects-middle.png','projects-end.png'];
const projectFiles=['project-pilates.png','project-longread.png','project-tour-de-parole.png','project-inside-out.png','project-celimax.png','project-napoli.png'];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function validateOverlay(){
 const captured=[];
 for(const profile of profiles){
  const directory=path.join(overlay,profile),source=path.join(phase3,profile);
  if(!fs.existsSync(directory))throw new Error(`Missing Phase 4 reference overlay: ${profile}`);
  if(!changedProfiles.includes(profile)){
   if(!fs.lstatSync(directory).isSymbolicLink()||fs.realpathSync(directory)!==fs.realpathSync(source))throw new Error(`${profile}: unchanged reference directory must link to Phase 3`);
   continue;
  }
  if(fs.lstatSync(directory).isSymbolicLink())throw new Error(`${profile}: approved-order overlay must be a directory`);
  const sourceNames=fs.readdirSync(source).sort();
  const overlayNames=fs.readdirSync(directory).sort();
  for(const name of sourceNames){
   const target=path.join(directory,name),original=path.join(source,name);
   if(stateFiles.includes(name)||projectFiles.includes(name)){
    if(!fs.existsSync(target)||fs.lstatSync(target).isSymbolicLink())throw new Error(`${profile}/${name}: expected an independent approved-order screenshot`);
    captured.push(path.relative(root,target));
   }else if(!fs.lstatSync(target).isSymbolicLink()||fs.realpathSync(target)!==fs.realpathSync(original)){
    throw new Error(`${profile}/${name}: unchanged reference must link to its original Phase 3 counterpart`);
   }
  }
  const manifest=path.join(directory,'approved-order-capture.json');
  if(!fs.existsSync(manifest)||fs.lstatSync(manifest).isSymbolicLink())throw new Error(`${profile}: approved-order capture manifest missing`);
  captured.push(path.relative(root,manifest));
  const expectedNames=[...sourceNames.filter(name=>!stateFiles.includes(name)&&!projectFiles.includes(name)),'approved-order-capture.json',...stateFiles,...projectFiles].sort();
  if(JSON.stringify(overlayNames)!==JSON.stringify(expectedNames))throw new Error(`${profile}: reference overlay has unexpected or missing files`);
 }
 if(captured.length!==40)throw new Error(`Expected 36 approved-order screenshots and 4 manifests, got ${captured.length}`);
 return captured.sort();
}

execFileSync(process.execPath,['tests/artifact-lock.mjs'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['tests/phase-3/reference-lock.mjs'],{cwd:root,stdio:'inherit'});
const files=validateOverlay();
if(process.argv.includes('--record')){
 const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
 if(!branch||branch==='main')throw new Error('Phase 4 reference lock may only be recorded on a dedicated branch.');
 const record={schemaVersion:1,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),approvedDelta:'The previously unintended tablet-only order is standardized to the canonical six-project order across all responsive layouts and locales.',files:Object.fromEntries(files.map(file=>[file,hash(path.join(root,file))]))};
 fs.writeFileSync(lockPath,JSON.stringify(record,null,2)+'\n');
 console.log(`Locked ${files.length-4} new tablet order captures and 4 capture manifests; unchanged references remain symlinked.`);
}else{
 const lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
 if(JSON.stringify(Object.keys(lock.files).sort())!==JSON.stringify(files))throw new Error('Phase 4 reference membership changed.');
 const failures=Object.entries(lock.files).filter(([file,digest])=>hash(path.join(root,file))!==digest).map(([file])=>file);
 if(failures.length)throw new Error(`Phase 4 reference hashes changed: ${failures.join(', ')}`);
 console.log(`PASS: ${files.length-4} Phase 4 order references and 4 capture manifests retain their recorded SHA-256.`);
}
