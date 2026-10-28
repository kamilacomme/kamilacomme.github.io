import BaseGatherer from 'lighthouse/core/gather/base-gatherer.js';
import {Audit} from 'lighthouse/core/audits/audit.js';

/** Read only after the sensitive measurement window; never change document state. */
export class RuntimeReadinessGatherer extends BaseGatherer {
  meta={supportedModes:['navigation']};
  async getArtifact(context){
    return context.driver.executionContext.evaluate(()=>{
      const curtainResources=performance.getEntriesByType('resource').map(entry=>entry.name).filter(name=>/curtain-cloth\.js|footer-curtain\.webp|three@0\.160\.0/i.test(name));
      const curtain=document.querySelector('curtain-cloth');
      const faces=[...document.fonts].filter(face=>face.status==='loaded').map(face=>face.family.replaceAll('"',''));
      return {lang:document.documentElement.lang,title:document.title,textLength:document.body.innerText.length,react:!!window.React,curtainCanvas:!!curtain?.querySelector('canvas'),curtainResourcesRequested:curtainResources,curtainDeferred:!curtain&&curtainResources.length===0,fontStatus:document.fonts.status,loadedFamilies:[...new Set(faces)],requiredFontsLoaded:faces.includes('Figtree')&&faces.includes('Inter'),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},device:{userAgent:navigator.userAgent,platform:navigator.platform,maxTouchPoints:navigator.maxTouchPoints,hover:matchMedia('(hover:hover)').matches,coarsePointer:matchMedia('(pointer:coarse)').matches},url:location.href};
    },{useIsolation:false,args:[],deps:[]});
  }
}
export class RuntimeReadinessAudit extends Audit {
  static get meta(){return{id:'portfolio-render-ready',title:'Portfolio rendered with below-fold curtain deferred',failureTitle:'Portfolio render or curtain deferral check failed',description:'Read-only verification inside the measured Lighthouse navigation; the below-fold curtain must not initialize on initial load. Zero performance score weight.',requiredArtifacts:['RuntimeReadiness']};}
  static audit(artifacts){
    const r=artifacts.RuntimeReadiness;
    return {score:r.textLength>300&&r.react&&r.curtainDeferred&&r.requiredFontsLoaded?1:0,details:{type:'debugdata',readiness:r}};
  }
}
