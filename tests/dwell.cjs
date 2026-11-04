/* npm run test:dwell after npx playwright install chromium.
   Real iPad/Pencil and Eye Tracking remain device acceptance tests. */
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer(async(req,res)=>{
   const url=new URL(req.url,'http://localhost'),rel=url.pathname.replace(/^\/Speechy\//,'');
   if(!url.pathname.startsWith('/Speechy/')||rel.includes('..')||rel.includes('node_modules')){res.writeHead(404).end();return;}
   try{const p=path.join(root,rel||'index.html'),body=await fs.readFile(p);res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':p.endsWith('.webmanifest')?'application/manifest+json':'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(body);}catch(_){res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
   browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
   const context=await browser.newContext({viewport:{width:1024,height:1366},hasTouch:true,isMobile:true});
   await context.route(/https:\/\//,r=>r.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/Speechy/`);await page.waitForFunction(()=>document.getElementById('app')?.inert===false);
   await page.evaluate(()=>{
     window.hits={a:0,b:0};window.spoken=[];speechSynthesis.speak=u=>spoken.push(u.text);speechSynthesis.cancel=()=>{};
     const fixture=document.createElement('div');fixture.id='dwellFixture';fixture.style.cssText='position:fixed;z-index:1000;left:20px;right:20px;bottom:100px;display:flex;gap:50px;padding:10px;background:#eee';
     for(const key of ['a','b']){const button=document.createElement('button');button.id='dwellTest'+key;button.textContent='Dwell '+key;button.style.cssText='width:200px;height:80px;background:white;border:2px solid blue';button.onclick=()=>hits[key]++;fixture.appendChild(button);}
     document.body.appendChild(fixture);settings.dwellEnabled=true;settings.dwellMs=800;applyDwellSettings();
   });
   const point=async id=>{const r=await page.locator('#'+id).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};};
   const reset=async()=>{await page.mouse.move(5,5);await page.evaluate(()=>{cancelDwell();dwellTouch=null;dwellReleaseClick=null;dwellBlocked=null;dwellIgnoreMouseUntil=0;hits={a:0,b:0};});};
   const waitHit=async(key,n=1)=>page.waitForFunction(({key,n})=>hits[key]===n,{key,n},{timeout:4000});
   const client=await context.newCDPSession(page);
   const start=async p=>client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2}]});
   const move=async p=>client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2}]});
   const end=async()=>client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const a=await point('dwellTesta'),b=await point('dwellTestb');
   // Pointer hover fires once and deliberately moving to another target rearms.
   await reset();await page.mouse.move(a.x,a.y);await waitHit('a');await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>hits.a),1);
   await page.mouse.move(b.x,b.y);await waitHit('b');
   // A mouse-only boundary event also rearms without requiring pointermove.
   await page.evaluate(({a,b})=>{const el=document.getElementById('dwellTesta');el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:a.x,clientY:a.y,relatedTarget:document.getElementById('dwellTestb')}));},{a,b});await waitHit('a',2);
   // A keyboard activation cancels any pointer countdown instead of speaking twice.
   await reset();await page.mouse.move(a.x,a.y);await page.locator('#dwellTesta').focus();await page.keyboard.press('Enter');await waitHit('a');await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>hits.a),1);
   // A mouse-only manual click also cancels a hover timer on Safari's fallback path.
   await reset();await page.mouse.move(a.x,a.y);await page.evaluate(p=>{const el=document.getElementById('dwellTesta');for(const type of ['mousedown','mouseup','click'])el.dispatchEvent(new MouseEvent(type,{bubbles:true,clientX:p.x,clientY:p.y,detail:1}));},a);await waitHit('a');await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>hits.a),1);
   // A normal trusted touch tap still activates exactly once.
   await reset();await start(a);await end();await waitHit('a');await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>hits.a),1);
   // A held contact activates once before release, with no trailing native tap.
   await reset();await start(a);await waitHit('a');await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>hits.a),1);await end();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>hits.a),1);
   // Keyboard activation remains independent of trailing-touch suppression.
   await page.locator('#dwellTesta').focus();await page.keyboard.press('Enter');await waitHit('a',2);
   // Holding a button that re-renders underneath the finger must not tap the replacement.
   await reset();await page.evaluate(()=>{document.getElementById('dwellTesta').onclick=()=>{hits.a++;const old=document.getElementById('dwellTesta'),replacement=old.cloneNode(true);replacement.onclick=()=>hits.b++;old.replaceWith(replacement);};});
   await start(a);await waitHit('a');await end();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>hits.b),0);await page.evaluate(()=>document.getElementById('dwellTesta').onclick=()=>hits.a++);
   // Movement/scroll/cancellation/second contacts never finish a pending hold.
   await reset();await start(a);await move({x:a.x+30,y:a.y});await page.waitForTimeout(950);await end();assert.equal(await page.evaluate(()=>hits.a),0);
   await reset();await start(a);await page.evaluate(()=>document.dispatchEvent(new Event('scroll')));await page.waitForTimeout(950);await end();assert.equal(await page.evaluate(()=>hits.a),0);
   await reset();await start(a);await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>hits.a),0);
   await reset();await start(a);await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y,id:1},{x:b.x,y:b.y,id:2}]});await page.waitForTimeout(950);await end();assert.equal(await page.evaluate(()=>hits.a+hits.b),0);
   // Leaving the app while a finger is held must not leave a stale contact that blocks later input.
   await reset();await start(a);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(950);await end();assert.equal(await page.evaluate(()=>hits.a),0);assert.equal(await page.evaluate(()=>dwellTouch),null);
   await start(b);await waitHit('b');await end();assert.equal(await page.evaluate(()=>hits.b),1);
   // Pencil contact follows the same hold path (native Pencil validation is manual).
   await reset();await page.evaluate(p=>{document.getElementById('dwellTesta').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'pen',pointerId:77,isPrimary:true,clientX:p.x,clientY:p.y,buttons:1}));},a);await waitHit('a');await page.evaluate(p=>document.getElementById('dwellTesta').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'pen',pointerId:77,isPrimary:true,clientX:p.x,clientY:p.y})),a);
   // Off means normal taps without hold timers. Pausing remains a manual action.
   await reset();await page.locator('#dwellToggle').click();assert.equal(await page.evaluate(()=>settings.dwellEnabled),false);await start(a);await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>hits.a),0);await end();await waitHit('a');await page.locator('#dwellToggle').click();
   await page.evaluate(()=>document.getElementById('dwellFixture').hidden=true);await reset();
   // Actual communication buttons, both layouts: one hold produces one utterance.
   for(const style of ['classic','nested']){
     await page.evaluate(style=>{settings.uiStyle=style;mode='speak';settings.dwellEnabled=true;settings.dwellMs=800;applyDwellSettings();updateStyleButton();activeSubtopic.quick=null;selectCat(CATS.find(c=>c.id==='quick'));spoken=[];dwellIgnoreMouseUntil=0;dwellBlocked=null;},style);
     if(style==='nested')await page.locator('.book-button').first().click();
     const phrase=page.locator(style==='classic'?'.tile:not(.random)':'.nested-phrase').first();await phrase.scrollIntoViewIfNeeded();const r=await phrase.boundingBox(),p={x:r.x+r.width/2,y:r.y+r.height/2};
     await start(p);await page.waitForFunction(()=>spoken.length===1,null,{timeout:4000});await end();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>spoken.length),1);
   }
   // Real touch scrolling on the long board stays possible with dwell enabled.
   await page.evaluate(()=>{settings.uiStyle='classic';updateStyleButton();selectCat(CATS.find(c=>c.id==='offduty'));document.querySelector('.content').scrollTop=0;spoken=[];});
   const first=page.locator('.tile:not(.random)').first();await first.scrollIntoViewIfNeeded();const r=await first.boundingBox();const p={x:r.x+r.width/2,y:r.y+r.height/2};const before=await page.locator('.content').evaluate(el=>el.scrollTop);
   await start(p);await move({x:p.x,y:p.y-160});await end();await page.waitForTimeout(1000);const after=await page.locator('.content').evaluate(el=>el.scrollTop);assert(after>before,'touch scrolling must remain available');assert.equal(await page.evaluate(()=>spoken.length),0);
   // Visible overlay/dialog close controls can be reached with hover dwell.
   await reset();await page.evaluate(()=>showBig('Dwell message'));let close=await point('bigClose');await page.mouse.move(close.x,close.y);await page.waitForFunction(()=>!document.getElementById('bigOverlay').classList.contains('open'));
   await reset();await page.locator('#cardBtn').click();close=await point('cardClose');await page.mouse.move(close.x,close.y);await page.waitForFunction(()=>!document.getElementById('cardOverlay').classList.contains('open'));
   await reset();await page.locator('#backupOpen').click();close=await point('backupClose');await page.mouse.move(close.x,close.y);await page.waitForFunction(()=>!document.getElementById('backupDialog').open);
   await page.reload();await page.waitForFunction(()=>document.getElementById('app')?.inert===false);assert.equal(await page.locator('#dwellToggle').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>settings.dwellMs),800);
   assert.deepEqual(errors,[],'no browser runtime errors');
   console.log('PASS: pointer and mouse-only dwell; one-shot touch/pen holds; quick taps; no duplicate release/re-render click; keyboard; movement/scroll/cancel/multi-touch; Off; actual speech buttons in both layouts; native touch scroll; modal close; saved settings.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
