const {test,expect}=require('@playwright/test');
const qa=require('../qa/helpers.cjs');

function heroSlideshowSelector(mode){
  if(mode==='mobile')return '.kc-mobile-hero-slideshow';
  if(mode==='tablet-portrait'||mode==='tablet-landscape')return '[data-kc-tablet-hero-slideshow]';
  return '[data-hplate]';
}

test('Hero slideshow pauses on reduced motion, preserves the frame and resumes at its existing cadence',async({page,context},info)=>{
  const {mode,language}=info.project.metadata;
  await page.emulateMedia({reducedMotion:'reduce'});
  await qa.routes(context);
  await qa.ready(page,language);
  const slides=page.locator(heroSlideshowSelector(mode));
  await expect(slides).toBeVisible();
  const visible=()=>slides.evaluate(el=>[...el.children].map(child=>getComputedStyle(child).opacity));
  const activeCount=state=>state.filter(value=>Number(value)>0.5).length;
  expect(activeCount(await visible())).toBe(1);

  const pausedFrame=await visible();
  await page.waitForTimeout(900);
  expect(await visible()).toEqual(pausedFrame);
  await expect(page.locator('h1:visible').first()).toBeVisible();

  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(visible,{timeout:5000}).not.toEqual(pausedFrame);
  expect(activeCount(await visible())).toBe(1);

  await page.emulateMedia({reducedMotion:'reduce'});
  const newlyPausedFrame=await visible();
  await page.waitForTimeout(900);
  expect(await visible()).toEqual(newlyPausedFrame);
});

test('Footer curtain defers until approach and pauses/resumes its existing canvas under live reduced-motion changes',async({page,context},info)=>{
  const {language}=info.project.metadata;
  await page.emulateMedia({reducedMotion:'reduce'});
  await qa.routes(context);
  const curtainRequests=[];
  page.on('request',request=>{if(/curtain-cloth\.js|footer-curtain\.webp|three@0\.160\.0/i.test(request.url()))curtainRequests.push(request.url());});
  await qa.ready(page,language);
  await page.waitForFunction(()=>performance.now()>1800);
  expect(await page.locator('curtain-cloth').count()).toBe(0);
  expect(curtainRequests).toEqual([]);

  await page.evaluate(()=>scrollTo(0,document.scrollingElement.scrollHeight));
  await qa.waitForCurtain(page);
  const curtain=page.locator('curtain-cloth');
  const canvas=curtain.locator('canvas');
  await expect(canvas).toBeVisible();
  const content=await page.evaluate(()=>({
    heading:!!document.querySelector('#contact [data-c="0"]')?.innerText,
    mail:document.querySelector('#contact a[href^="mailto:"]')?.getClientRects().length>0,
    legal:[...document.querySelectorAll('#contact [data-c="4"] a')].length,
    textureWidth:document.querySelector('curtain-cloth').left.mat.map.image.naturalWidth,
    target:document.querySelector('curtain-cloth').target,
    progress:document.querySelector('curtain-cloth').progress,
  }));
  expect(content.heading).toBe(true);
  expect(content.mail).toBe(true);
  expect(content.legal).toBeGreaterThanOrEqual(2);
  expect(content.textureWidth).toBeGreaterThan(0);
  expect(content.progress).toBeCloseTo(content.target,3);

  const identity=await curtain.evaluate(el=>{window.__qaReducedCurtain=el;return el;});
  await curtain.evaluate(el=>{
    const renderer=el.renderer;
    const render=renderer.render.bind(renderer);
    el.__qaRenderCount=0;
    renderer.render=(...args)=>{el.__qaRenderCount++;return render(...args);};
  });
  await page.waitForTimeout(700);
  const paused=await curtain.evaluate(el=>({frame:el._frame||0,renders:el.__qaRenderCount,progress:el.progress,target:el.target}));
  await page.waitForTimeout(500);
  const pausedAgain=await curtain.evaluate(el=>({frame:el._frame||0,renders:el.__qaRenderCount,progress:el.progress,target:el.target}));
  expect(pausedAgain.frame).toBe(paused.frame);
  expect(pausedAgain.renders).toBe(paused.renders);

  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(()=>curtain.evaluate(el=>el._frame||0)).toBeGreaterThan(pausedAgain.frame);
  expect(await page.evaluate(()=>document.querySelector('curtain-cloth')===window.__qaReducedCurtain)).toBe(true);
  await expect(canvas).toHaveCount(1);

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(650);
  const pausedAfterResume=await curtain.evaluate(el=>({frame:el._frame||0,renders:el.__qaRenderCount}));
  await page.waitForTimeout(500);
  const settledPaused=await curtain.evaluate(el=>({frame:el._frame||0,renders:el.__qaRenderCount}));
  expect(settledPaused).toEqual(pausedAfterResume);
  expect(await page.evaluate(()=>document.querySelector('curtain-cloth')===window.__qaReducedCurtain)).toBe(true);
  expect(await canvas.count()).toBe(1);
  expect(curtainRequests.some(url=>/curtain-cloth\.js/i.test(url))).toBe(true);
  expect(curtainRequests.some(url=>/footer-curtain\.webp/i.test(url))).toBe(true);
  expect(curtainRequests.some(url=>/three@0\.160\.0/i.test(url))).toBe(true);
});
