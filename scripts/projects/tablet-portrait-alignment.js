
/* Tablet Projects matches the verified English tablet fix.
   The About frame owns width/scale/origin. The project section remains in
   document flow and follows that frame after responsive layout updates.
   French Footer, Hero, About and all project content are unchanged. */
(function(){
'use strict';
let tabletProjectFrameRaf=0;
function fitTabletProjectFrame(){
 tabletProjectFrameRaf=0;
 if(window.innerWidth<500||window.innerWidth>1080||window.innerWidth>=window.innerHeight)return;
 const stage=document.getElementById('kc-t-stage');
 const viewport=document.getElementById('kc-t-viewport');
 const about=document.querySelector('#apropos-t > div > div');
 if(!stage||!viewport||!about)return;
 const scale=window.__kcTabletScale||1;
 const width=about.offsetWidth||834;
 const aboutRect=about.getBoundingClientRect();
 const viewportRect=viewport.getBoundingClientRect();
 if(!aboutRect.width||!viewportRect.width)return;
 // CSS-centered About uses the page content width, which excludes the
 // vertical scrollbar. Projects must use About's actual rendered left edge
 // rather than window.innerWidth (which includes that scrollbar).
 const stageLeft=aboutRect.left-viewportRect.left;
 // Projects remains in normal document flow, so give its relative stage
 // the same rendered horizontal origin as the centered About frame.
 const values={
  width:width+'px',
  position:'relative',
  left:stageLeft+'px',
  transform:'scale('+scale+')'
 };
 for(const [name,value] of Object.entries(values)){
  if(stage.style[name]!==value)stage.style[name]=value;
 }
 const h=(1655*scale)+'px';
 if(viewport.style.height!==h)viewport.style.height=h;

}
function queueTabletProjectFrame(){
 if(tabletProjectFrameRaf)return;
 tabletProjectFrameRaf=requestAnimationFrame(fitTabletProjectFrame);
}
window.addEventListener('resize',queueTabletProjectFrame);
window.addEventListener('load',queueTabletProjectFrame);
const tabletProjectFrameObserver=new MutationObserver(queueTabletProjectFrame);
function attachTabletProjectFrame(){
 const stage=document.getElementById('kc-t-stage');
 const head=document.querySelector('[data-c="0"]');
 if(!stage||!head)return false;
 tabletProjectFrameObserver.disconnect();
 tabletProjectFrameObserver.observe(stage,{attributes:true,attributeFilter:['style']});
 // Follow About's centered frame if the main controller changes its width
 // or transform after the Projects fit.
 const about=document.querySelector('#apropos-t > div > div');
 if(about)tabletProjectFrameObserver.observe(about,{attributes:true,attributeFilter:['style']});
 tabletProjectFrameObserver.observe(head,{attributes:true,attributeFilter:['style']});
 const info=head.parentElement?.querySelector('[data-c="1"]');
 if(info)tabletProjectFrameObserver.observe(info,{attributes:true,attributeFilter:['style']});
 queueTabletProjectFrame();
 return true;
}
const tabletProjectMountObserver=new MutationObserver(()=>{
 if(attachTabletProjectFrame())tabletProjectMountObserver.disconnect();
});
tabletProjectMountObserver.observe(document.documentElement,{childList:true,subtree:true});
attachTabletProjectFrame();

})();
