/* Settings integration: real controls, persistence, nested recovery and access. */
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
  const server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost'),rel=url.pathname.replace(/^\/Speechy\//,'');
    if(!url.pathname.startsWith('/Speechy/')||rel.includes('..')||rel.includes('node_modules')){res.writeHead(404).end();return;}
    try{
      const file=path.join(root,rel||'index.html'),body=await fs.readFile(file);
      res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
      res.setHeader('Cache-Control','no-store');res.end(body);
    }catch(_){res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});
    const context=await browser.newContext({viewport:{width:1280,height:900}}),errors=[];
    await context.route(/https:\/\//,route=>route.abort());
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const url=`http://127.0.0.1:${server.address().port}/Speechy/`;
    const ready=()=>page.waitForFunction(()=>document.getElementById('app')?.inert===false);
    const saved=()=>page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Saved on this device');
    const range=async(id,value)=>page.locator('#'+id).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await page.goto(url);await ready();
    await page.evaluate(async()=>{custom.now=['Keep my phrase'];starred=['Keep my phrase'];mode='build';buffer='Keep my message';lastSaid='Previous spoken message';renderSaid();await save();});
    const original=await page.evaluate(()=>({snapshot:boardSnapshot(),journal:localStorage.getItem('speechy:board:v1')}));
    await page.locator('#setBtn').click();
    assert.equal(await page.locator('#setSheet').getAttribute('aria-labelledby'),'settingsTitle');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsTitle');
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsCloseTop');
    // A native modal keeps the board inert and Escape restores its opener.
    assert.equal(await page.evaluate(()=>{document.getElementById('topicsToggle').focus();return document.activeElement.id;}),'settingsCloseTop');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.getElementById('setSheet').open),false);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'setBtn');
    assert.deepEqual(await page.evaluate(()=>({snapshot:boardSnapshot(),journal:localStorage.getItem('speechy:board:v1')})),original,'opening and closing preferences must not create a save');

    await page.locator('#setBtn').click();
    await page.locator('#settingsTheme').selectOption('dark');
    await page.locator('#settingsLayout').selectOption('classic');
    assert.equal(await page.locator('#classicSizeBar').isVisible(),true);
    await range('classicButtonSize',110);await page.locator('#classicSizeIncrease').click();
    await range('rate',1.1);await page.locator('#largeTargets').check();
    await page.locator('#settingsTopicsVisible').uncheck();await page.locator('#settingsTopicsPinned').uncheck();
    await page.locator('#cardEdit').fill('My introduction from Settings');
    await range('dwellDuration',2200);await page.locator('#settingsDwellEnabled').check();
    await saved();
    assert.deepEqual(await page.evaluate(()=>({theme:settings.theme,layout:settings.uiStyle,size:settings.classicButtonSize,rate:settings.rate,large:settings.largeTargets,visible:settings.topicsVisible,pinned:settings.topicsPinned,dwell:settings.dwellEnabled,delay:settings.dwellMs,card:settings.card})),{theme:'dark',layout:'classic',size:115,rate:1.1,large:true,visible:false,pinned:false,dwell:true,delay:2200,card:'My introduction from Settings'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.equal(await page.locator('#layoutAll').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#dwellToggle').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#topicsToggle').getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('#settingsSaveStatus').innerText(),'Saved on this device');
    assert.deepEqual(await page.evaluate(()=>({custom:custom.now,starred,mode,buffer,lastSaid})),{custom:['Keep my phrase'],starred:['Keep my phrase'],mode:'build',buffer:'Keep my message',lastSaid:'Previous spoken message'});
    // Test speech without replacing the communicator's message or opening an obscured overlay.
    await page.locator('#setTest').click();await page.locator('#settingsStopVoice').click();
    assert.equal(await page.evaluate(()=>lastSaid),'Previous spoken message');
    assert.equal(await page.locator('.overlay.open').count(),0);
    await page.locator('#setClose').click();await page.reload();await ready();
    await page.locator('#setBtn').click();
    assert.equal(await page.locator('#settingsTheme').inputValue(),'dark');
    assert.equal(await page.locator('#settingsLayout').inputValue(),'classic');
    assert.equal(await page.locator('#classicButtonSize').inputValue(),'115');
    assert.equal(await page.locator('#rate').inputValue(),'1.1');
    assert.equal(await page.locator('#dwellDuration').inputValue(),'2200');
    assert.equal(await page.locator('#settingsDwellEnabled').isChecked(),true);
    assert.equal(await page.locator('#largeTargets').isChecked(),true);
    assert.equal(await page.locator('#settingsTopicsVisible').isChecked(),false);
    assert.equal(await page.locator('#settingsTopicsPinned').isChecked(),false);
    assert.equal(await page.locator('#cardEdit').inputValue(),'My introduction from Settings');
    await page.locator('#settingsCloseTop').click();
    // The fast board controls and their Settings counterparts stay synchronized.
    await page.locator('#dwellToggle').click();await page.locator('#topicsToggle').click();await page.locator('#layoutGrouped').click();
    await page.locator('#setBtn').click();
    assert.equal(await page.locator('#settingsDwellEnabled').isChecked(),false);
    assert.equal(await page.locator('#settingsTopicsVisible').isChecked(),true);
    assert.equal(await page.locator('#settingsLayout').inputValue(),'nested');
    assert.equal(await page.locator('#classicSizeBar').isVisible(),false);
    // Dwell can close the native panel, and the reset stays behind an explicit choice.
    await range('dwellDuration',800);await page.locator('#settingsDwellEnabled').check();
    await page.locator('#settingsCloseTop').hover();
    await page.waitForFunction(()=>!document.getElementById('setSheet').open);
    await page.mouse.move(0,0);await page.locator('#setBtn').click();
    await page.locator('#settingsDwellEnabled').uncheck();
    assert.equal(await page.locator('#resetBtn').isVisible(),false);
    await page.locator('.settings-help summary').filter({hasText:'Reset board'}).click();
    page.once('dialog',dialog=>dialog.dismiss());await page.locator('#resetBtn').click();
    assert.deepEqual(await page.evaluate(()=>custom.now),['Keep my phrase']);

    // Restoring from the nested recovery dialog must also update the open settings form.
    await page.locator('#cardEdit').fill('Recovery card');await saved();
    await page.locator('#cardEdit').fill('Newer card');await saved();
    await page.locator('#settingsBackup').click();
    assert.equal(await page.evaluate(()=>document.getElementById('setSheet').open),true);
    page.once('dialog',dialog=>dialog.accept());await page.locator('#backupPrevious').click();
    await page.waitForFunction(()=>document.getElementById('backupMessage').textContent==='Board restored and saved on this device.');
    await page.locator('#backupClose').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsBackup');
    assert.equal(await page.locator('#cardEdit').inputValue(),'Recovery card');
    await page.locator('#setClose').click();await page.reload();await ready();
    assert.equal(await page.evaluate(()=>settings.card),'Recovery card');

    // Report a genuine failed save inside Settings, then recover using its backups entry.
    await page.locator('#setBtn').click();
    await page.evaluate(()=>{
      window.failSaving=true;
      const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.failSaving&&k.startsWith('speechy:'))throw new DOMException('Full','QuotaExceededError');return set.call(this,k,v);};
      const transaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){const tx=transaction.apply(this,args);if(window.failSaving&&args[0]==='board'&&args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx;};
    });
    await page.locator('#cardEdit').fill('Retry this introduction');
    await page.waitForFunction(()=>document.getElementById('settingsSaveStatus').dataset.failed==='true');
    assert((await page.locator('#settingsSaveStatus').innerText()).startsWith('Not saved'));
    await page.evaluate(()=>{window.failSaving=false;});
    await page.locator('#settingsBackup').click();await page.locator('#backupRetry').click();await saved();
    await page.locator('#backupClose').click();assert.equal(await page.locator('#settingsSaveStatus').getAttribute('data-failed'),'false');

    const screenshots=await fs.mkdtemp(path.join(os.tmpdir(),'speechy-settings-'));
    // Scroll the panel, with the heading, close control and save footer still reachable.
    for(const [name,width,height] of [['desktop',1280,900],['ipad',1024,768],['phone',390,844],['landscape',844,390]]){
      await page.setViewportSize({width,height});
      if(name==='ipad'){
        await page.locator('#settingsTheme').selectOption('light');
        await page.locator('#settingsLayout').selectOption('classic');
      }
      await page.locator('.settings-body').evaluate(element=>{element.scrollTop=0;});
      const box=await page.locator('#setSheet').boundingBox();
      assert(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=height,`${name}: modal fits`);
      assert(await page.locator('#settingsCloseTop').isVisible());
      const footer=await page.locator('.settings-footer').boundingBox();assert(footer.y>=0&&footer.y+footer.height<=height,`${name}: footer fits`);
      assert.equal(await page.locator('.settings-body').evaluate(element=>element.scrollWidth<=element.clientWidth),true,`${name}: no horizontal panel overflow`);
      await page.screenshot({path:path.join(screenshots,`${name}.png`)});
      if(name==='phone'){
        await page.locator('#classicButtonSize').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(screenshots,'phone-appearance.png')});
      }
      await page.locator('#settingsBackup').scrollIntoViewIfNeeded();
      const backup=await page.locator('#settingsBackup').boundingBox();assert(backup.y>=box.y&&backup.y+backup.height<=footer.y,`${name}: lower controls reachable`);
    }
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'setBtn');
    await page.reload();await ready();assert.equal(await page.evaluate(()=>settings.card),'Retry this introduction');
    await page.locator('#setBtn').click();
    await page.locator('#settingsTheme').selectOption('sepia');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'sepia');
    await saved();
    await page.reload();await ready();
    await page.locator('#setBtn').click();
    assert.equal(await page.locator('#settingsTheme').inputValue(),'sepia');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'sepia');
    await page.locator('#settingsTheme').selectOption('high-contrast');
    await saved();
    await page.reload();await ready();
    assert.equal(await page.locator('html').getAttribute('data-high-contrast'),'');
    assert.equal(await page.locator('#setBtn').evaluate(button=>getComputedStyle(button).borderTopWidth),'2px');
    assert.equal(await page.locator('#layoutAll').evaluate(button=>getComputedStyle(button).backgroundColor),'rgb(255, 224, 92)');
    await page.locator('#setBtn').click();
    assert.equal(await page.locator('#settingsTheme').inputValue(),'high-contrast');
    await page.locator('#settingsTheme').selectOption('light');
    assert.equal(await page.locator('html').getAttribute('data-high-contrast'),null);
    await page.locator('[data-settings-section="settingsSpeech"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsSpeech');
    await page.locator('#settingsTapMode').selectOption('build');
    assert.equal(await page.locator('#modeBuild').getAttribute('aria-pressed'),'true');
    await page.locator('[data-settings-section="settingsBoard"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsBoard');
    await page.getByRole('button',{name:'Manage GIFs'}).click();
    assert(await page.locator('#gifSheet').isVisible());
    assert.equal(await page.evaluate(()=>document.activeElement.id),'gifCategory');
    await page.locator('#gifCancel').click();
    await page.locator('#setBtn').click();
    await page.locator('#settingsInstall').click();
    assert(await page.locator('#installAppDialog').isVisible());
    await page.keyboard.press('Escape');
    assert.deepEqual(errors,[],'no runtime errors');
    console.log('PASS: modal focus/Escape, immediate settings and reload, message preservation, linked quick controls, dwell close, reset cancellation, nested recovery, failed-save retry, desktop/iPad/phone/landscape panel.');
    console.log('Settings screenshots:',screenshots);
  }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
