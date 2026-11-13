/* Run after npm ci and npx playwright install chromium.
   CHROMIUM_EXECUTABLE_PATH optionally selects a preinstalled Chromium. */
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer(async(req,res)=>{
   const url=new URL(req.url,'http://localhost'),rel=url.pathname.replace(/^\/Speechy\//,'');
   if(!url.pathname.startsWith('/Speechy/')||rel.includes('..')||rel.includes('node_modules')){res.writeHead(404).end();return;}
   try{const file=path.join(root,rel||'index.html');const body=await fs.readFile(file);const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png'})[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(body);}catch(_){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;const temp=await fs.mkdtemp(path.join(os.tmpdir(),'speechy-test-'));
 try{
   browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});
   const context=await browser.newContext({acceptDownloads:true,viewport:{width:1024,height:768}});
   const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
   await context.route(/https:\/\//,route=>route.abort()); // All app assets are local; omit external fonts.
   const url=`http://127.0.0.1:${server.address().port}/Speechy/`;
   async function ready(page){await page.waitForFunction(()=>document.getElementById('app')?.inert===false);}
   const page=await context.newPage();await page.goto(url);await ready(page);
   await page.evaluate(()=>{
     mode='build';buffer='My unfinished message';lastSaid='My previous phrase';renderSaid();
     window.momentSpoken=[];
     speechSynthesis.speak=utterance=>momentSpoken.push(utterance.text);
     speechSynthesis.cancel=()=>{};
   });
   await page.locator('#momentBtn').focus();await page.keyboard.press('Enter');
   assert.deepEqual(await page.evaluate(()=>momentSpoken),['I have something to say. Please give me a moment.']);
   assert.deepEqual(await page.evaluate(()=>({mode,buffer,lastSaid})),{mode:'build',buffer:'My unfinished message',lastSaid:'My previous phrase'});
   assert.equal(await page.locator('#saidText').innerText(),'My unfinished message');
   await page.evaluate(()=>{mode='speak';renderSaid();});
   // Phrase search preserves navigation and follows both speaking modes.
   const beforeSearch=await page.evaluate(()=>({activeCat,style:settings.uiStyle}));
   await page.locator('#findPhraseBtn').click();
   assert(await page.locator('#findPhraseInput').evaluate(el=>el===document.activeElement));
   await page.locator('#findPhraseInput').fill('break');
   await page.waitForFunction(()=>document.querySelectorAll('#findPhraseResults button').length>0);
   const found=await page.locator('#findPhraseResults button span').first().innerText();
   await page.locator('#findPhraseResults button').first().focus();await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>momentSpoken.at(-1)),found);
   assert.deepEqual(await page.evaluate(()=>({activeCat,style:settings.uiStyle})),beforeSearch);
   await page.evaluate(()=>{mode='build';buffer='';renderSaid();(custom.now ||= []).push('Unique custom search phrase');});
   await page.locator('#findPhraseBtn').click();await page.locator('#findPhraseInput').fill('Unique custom search');
   await page.locator('#findPhraseResults button').click();
   assert.equal(await page.evaluate(()=>buffer),'Unique custom search phrase');
   assert.equal(await page.evaluate(()=>momentSpoken.at(-1)),found,'build must not speak');
   await page.setViewportSize({width:390,height:844});
   await page.locator('#findPhraseBtn').click();await page.locator('#findPhraseInput').fill('no-such-phrase-xyz');
   assert((await page.locator('#findPhraseStatus').innerText()).startsWith('No phrases found'));
   const searchBox=await page.locator('#findPhraseDialog').boundingBox();
   assert(searchBox.x>=0&&searchBox.x+searchBox.width<=390);
   await page.locator('#findPhraseInput').fill('coffee');
   assert(await page.locator('#findPhraseResults button').count()>0);
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>document.activeElement===document.getElementById('findPhraseBtn'));
   await page.setViewportSize({width:1024,height:768});
   await page.evaluate(()=>{mode='speak';buffer='';custom.now=custom.now.filter(p=>p!=='Unique custom search phrase');renderSaid();});
   // Undo restores whole phrases and original punctuation without speaking.
   await page.evaluate(()=>{mode='build';buffer='';phraseUndo=[];addToBuffer('Can you help?',false);addToBuffer('after lunch.',true);});
   const speechCount=await page.evaluate(()=>momentSpoken.length);
   assert.equal(await page.evaluate(()=>buffer),'Can you help after lunch?');
   await page.locator('#buildUndo').focus();await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>buffer),'Can you help?');
   await page.locator('#buildUndo').click();assert.equal(await page.evaluate(()=>buffer),'');
   assert(await page.locator('#buildUndo').isDisabled());
   assert.equal(await page.evaluate(()=>momentSpoken.length),speechCount);
   await page.evaluate(()=>addToBuffer('A new message.',false));
   await page.locator('#buildClear').click();assert(await page.locator('#buildUndo').isDisabled());
   await page.evaluate(()=>{addToBuffer('Old draft.',false);buffer='Replacement draft.';renderSaid();});
   assert(await page.locator('#buildUndo').isDisabled());
   await page.evaluate(()=>{mode='speak';buffer='';renderSaid();});
   // Exercise the phrase editor and immediate saving in the actual app.
   await page.locator('#editBtn').click();await page.evaluate(()=>openAdd('now'));
   await page.locator('#addInput').fill('Browser restart phrase');await page.locator('#addSave').click();
   await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Saved on this device');
   await page.locator('#setBtn').click();await page.locator('#cardEdit').fill('My saved card');await page.locator('#setClose').click();
   await page.evaluate(async()=>{starred=[];settings.uiStyle='classic';await save();refreshBoard();});
   await page.reload();await ready(page);
   assert(await page.evaluate(()=>custom.now.includes('Browser restart phrase')));
   assert.equal(await page.evaluate(()=>settings.card),'My saved card');
   assert.deepEqual(await page.evaluate(()=>starred),[]);assert.equal(await page.evaluate(()=>settings.uiStyle),'classic');
   // Upload a real GIF and prove a downloaded backup restores its bytes.
   const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
   await page.locator('#gifManageBtn').click();await page.locator('#gifCategory').selectOption('now');
   await page.locator('#gifPhrase').selectOption('Browser restart phrase');
   await page.locator('#gifUpload').setInputFiles({name:'test.gif',mimeType:'image/gif',buffer:gif});await page.locator('#gifSave').click();
   await page.waitForFunction(()=>!document.getElementById('gifSheet').classList.contains('open'));
   const oldKey=await page.evaluate(()=>gifUploads['Browser restart phrase']);assert(oldKey);
   await page.locator('#backupOpen').click();const downloading=page.waitForEvent('download');await page.locator('#backupDownload').click();
   const download=await downloading,backupPath=path.join(temp,'board.json');await download.saveAs(backupPath);
   const file=JSON.parse(await fs.readFile(backupPath,'utf8'));assert.equal(file.images.length,1);assert.equal(file.images[0].data,gif.toString('base64'));
   await page.locator('#backupClose').click();await page.evaluate(async()=>{custom.now=['Temporary replacement'];gifUploads={};settings.card='Replacement card';await save();refreshBoard();});
   await page.locator('#backupOpen').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#backupFile').setInputFiles(backupPath);
   await page.waitForFunction(()=>document.getElementById('backupMessage').textContent==='Board restored and saved on this device.');
   assert(await page.evaluate(()=>custom.now.includes('Browser restart phrase')));assert.equal(await page.evaluate(()=>settings.card),'My saved card');
   assert.notEqual(await page.evaluate(()=>gifUploads['Browser restart phrase']),oldKey);
   assert.deepEqual(await page.evaluate(async()=>Array.from(new Uint8Array(await (await gifStore('get',gifUploads['Browser restart phrase'])).arrayBuffer()))),Array.from(gif));
   await page.locator('#backupClose').click();
   // Inject a quota failure and an aborted database transaction, then retry via UI.
   await page.evaluate(()=>{
     window.failSaving=true;
     const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.failSaving&&k.startsWith('speechy:'))throw new DOMException('Full','QuotaExceededError');return set.call(this,k,v);};
     const transaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){const tx=transaction.apply(this,args);if(window.failSaving&&args[0]==='board'&&args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx;};
   });
   await page.evaluate(async()=>{custom.now.push('Unsaved then retried');await save();});
   assert((await page.locator('#saveStatus').innerText()).startsWith('Not saved'));
   await page.evaluate(()=>{window.failSaving=false;});await page.locator('#backupOpen').click();await page.locator('#backupRetry').click();
   await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Saved on this device');await page.locator('#backupClose').click();
   await page.reload();await ready(page);assert(await page.evaluate(()=>custom.now.includes('Unsaved then retried')));
   // An older window cannot silently overwrite the current board.
   const stale=await context.newPage();await stale.goto(url);await ready(stale);
   await page.evaluate(async()=>{custom.now.push('Newest window edit');await save();});
   await stale.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Another Speechy window'));
   assert.equal(await stale.evaluate(async()=>{custom.now.push('Stale edit');return save();}),false);await stale.close();
   await page.reload();await ready(page);assert(await page.evaluate(()=>custom.now.includes('Newest window edit')));assert.equal(await page.evaluate(()=>custom.now.includes('Stale edit')),false);
   // Restore the previous version through the user-facing recovery control.
   await page.evaluate(async()=>{custom.now=['Previous version'];await save();custom.now=['Current version'];await save();refreshBoard();});
   await page.locator('#backupOpen').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#backupPrevious').click();
   await page.waitForFunction(()=>document.getElementById('backupMessage').textContent==='Board restored and saved on this device.');
   assert.deepEqual(await page.evaluate(()=>custom.now),['Previous version']);await page.locator('#backupClose').click();
   // Narrow-screen dialog remains inside the viewport and controls stay usable.
   await page.setViewportSize({width:390,height:844});await page.locator('#backupOpen').click();
   const box=await page.locator('#backupDialog').boundingBox();assert(box.x>=0&&box.x+box.width<=390);assert(box.y>=0&&box.y+box.height<=844);
   await page.screenshot({path:path.join(temp,'backup-mobile.png')});await page.locator('#backupClose').click();
   // After shell preparation, reopen in airplane-mode conditions.
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await ready(page);await context.setOffline(true);
   await page.reload();await ready(page);assert.deepEqual(await page.evaluate(()=>custom.now),['Previous version']);await context.setOffline(false);
   // If all local copies are unreadable, a confirmed portable restore still works.
   await page.evaluate(async()=>{
     localStorage.setItem('speechy:board:v1','{broken');localStorage.removeItem('speechy:board:v1:previous');localStorage.removeItem('aac:board');
     await new Promise((resolve,reject)=>{const request=indexedDB.open('speechy-board',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('board','readwrite');tx.objectStore('board').put({savedAt:1,data:{}},'main');tx.objectStore('board').delete('previous');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};});
   });
   await page.reload();await ready(page);assert((await page.locator('#saveStatus').innerText()).includes('could not be opened'));
   await page.locator('#backupOpen').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#backupFile').setInputFiles(backupPath);
   await page.waitForFunction(()=>document.getElementById('backupMessage').textContent==='Board restored and saved on this device.');
   assert(await page.evaluate(()=>custom.now.includes('Browser restart phrase')));
   await page.locator('#backupClose').click();await page.reload();await ready(page);assert(await page.evaluate(()=>custom.now.includes('Browser restart phrase')));
   assert.deepEqual(errors,[],'no runtime errors');
   console.log('PASS: browser edits/reload, empty favorites, uploaded GIF backup/restore, failed-save UI/retry, stale-window protection, previous-save recovery, mobile dialog, offline reopen.');
   console.log('Preview screenshot:',path.join(temp,'backup-mobile.png'));
 }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
