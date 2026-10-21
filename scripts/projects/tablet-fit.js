
(()=>{
 let attached=false;
 function attach(){
  if(attached)return;
  if(!document.getElementById('kc-t-stage')||!document.getElementById('kc-m-canvas')||document.querySelectorAll('#kc-tablet-projets .ticket').length!==6||document.querySelectorAll('#kc-mobile-projets .project').length!==6)return;
  attached=true;
  (()=>{ const viewport=document.querySelector('#kc-t-viewport'),stage=document.querySelector('#kc-t-stage');function fit(){
  const st=window.__kcTabletScale||1;
  stage.style.width=(window.innerWidth/st)+'px';
  stage.style.transform='scale('+st+')';
  stage.style.height='1655px';
  viewport.style.width='100%';
  viewport.style.height=(1655*st)+'px';
  // Use the ACTUAL rendered Hero line as the tablet type-size reference.
  // Both lines are measured after the same scale is applied; no second
  // scale formula or permanent font override is allowed to accumulate.
  const projectTitle=stage.querySelector('h1');
  const projectLine=projectTitle&&projectTitle.querySelector('.kc-title-line');
  const hero=document.querySelector('[data-kc-tablet-hero-title]');
  const heroLine=hero&&hero.querySelector('span');
  if(projectTitle&&projectLine&&heroLine){
    projectTitle.style.fontSize='48px';
    const target=heroLine.getBoundingClientRect().height;
    const current=projectLine.getBoundingClientRect().height;
    if(target>0&&current>0){
      const ratio=Math.max(.4,Math.min(1.4,target/current));
      projectTitle.style.fontSize=(48*ratio).toFixed(3)+'px';
    }
  }
}window.__kcTabletProjectFit=fit;fit();// Tablet video playback is initialized independently after component mounting below.
})();
(()=>{ 
// Mobile Projects geometry is managed by the independent layout observer below.
// Mobile video playback is initialized independently after component mounting below.

})();
 }
 const observer=new MutationObserver(()=>{attach();if(attached)observer.disconnect()});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 attach();window.addEventListener('load',attach,{once:true});
})();