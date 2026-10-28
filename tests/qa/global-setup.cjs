const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
module.exports=async config=>{
 if(config.updateSnapshots==='none')return;
 if(process.env.REGRESSION_PROBE==='1')throw new Error('Negative control must never update references');
 if(process.env.BASE_URL && process.env.BASE_URL!=='http://127.0.0.1:8000')throw new Error('Recording restricted to original checkout on http://127.0.0.1:8000');
 const root=path.resolve(__dirname,'../..');
 const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
 if(!branch || branch==='main')throw new Error('Reference recording requires a dedicated non-main branch');
 const inventory=require('../baseline/content-inventory.json');
 for(const [file,data] of Object.entries(inventory.sourceIntegrity)){
  const bytes=fs.readFileSync(path.join(root,file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==data.sha256)throw new Error('Refuse recording changed original source: '+file);
 }
 process.env.UPDATE_BASELINE='1';
};
