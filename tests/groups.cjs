/* Content names must lead to the correct buttons without losing any phrases. */
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
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});
    const context=await browser.newContext({viewport:{width:1280,height:900}}),errors=[];
    await context.route(/https:\/\//,route=>route.abort());
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/Speechy/`);
    const ready=()=>page.waitForFunction(()=>document.getElementById('app')?.inert===false);await ready();
    const coverage=await page.evaluate(()=>CATS.map(cat=>{
      const source=phrasesFor(cat.id),groups=subtopicsFor(cat,source);
      return {id:cat.id,name:cat.name,source,groups};
    }));
    for(const {id,name,source,groups} of coverage){
      assert.deepEqual(groups.flatMap(group=>group.phrases).sort(),source.slice().sort(),`${id}: each phrase occurs exactly once`);
      assert(groups.every(group=>group.name.trim()&&group.phrases.length),`${id}: no empty panel`);
      assert(groups.every(group=>!(group.name.startsWith(name+' ')&&/ \d+$/.test(group.name))),`${id}: no numbered topic labels`);
    }
    const choose=async id=>page.evaluate(id=>{activeSubtopic[id]=null;selectCat(CATS.find(cat=>cat.id===id));},id);
    await choose('now');
    assert.deepEqual(await page.locator('.book-button').allTextContents(),['Speech & listening','Breaks & comfort','Typing & showing']);
    await page.locator('.book-item').filter({has:page.getByRole('button',{name:'Typing & showing',exact:true})}).locator('.book-preview-trigger').click();
    assert.equal(await page.locator('#bookPreviewPanel strong').innerText(),'Typing & showing — preview');
    assert.deepEqual(await page.locator('#bookPreviewPanel li').allTextContents(),["I'm going to type this out instead.","It's easier if I show you on the screen."]);
    await page.getByRole('button',{name:'Typing & showing',exact:true}).click();
    assert.equal(await page.locator('.nested-center').innerText(),'Typing & showing');
    assert.deepEqual(await page.locator('.nested-phrase').allTextContents(),["I'm going to type this out instead.","It's easier if I show you on the screen."]);
    await page.locator('.nested-back').click();
    await choose('ask');await page.getByRole('button',{name:'Help & writing',exact:true}).click();
    assert.deepEqual(await page.locator('.nested-phrase').allTextContents(),['Could you help me with something?','Could you write that down for me?']);
    await choose('food');assert.deepEqual(await page.locator('.book-button').allTextContents(),['Menus & ordering','Seating & comfort','Checks, boxes & thanks']);
    await choose('offduty');assert.deepEqual(await page.locator('.book-button').allTextContents(),['Courtroom','Church','Medical file','Robot voice','Nebraska & Idaho','At home','Pure dork']);

    // Renaming a phrase via the real editor must not leave it hidden in a stale group.
    await choose('now');await page.locator('#editBtn').click();
    page.once('dialog',dialog=>dialog.accept('I will type a message for you.'));
    await page.evaluate(()=>editPhrase('now',"I'm going to type this out instead."));
    await page.locator('#editBtn').click();
    await page.getByRole('button',{name:'I will type a message for you.',exact:true}).click();
    assert.deepEqual(await page.locator('.nested-phrase').allTextContents(),['I will type a message for you.']);
    await page.evaluate(async()=>{
      custom.food=['A table for two near the window, please.','Can I show you my order on this screen?'];
      starred=['Could I see a menu, please?','I will type a message for you.','Unlisted favorite for the weekend.'];
      counts={'Could I see a menu, please?':5,'Unlisted recent phrase about tomorrow.':3};
      phraseOrder.now=["It's easier if I show you on the screen.","Could you slow down a little for me?","Give me a second and I'll get there."];
      await save();
    });
    await page.reload();await ready();
    const after=await page.evaluate(()=>CATS.map(cat=>({id:cat.id,source:phrasesFor(cat.id),groups:subtopicsFor(cat,phrasesFor(cat.id))})));
    for(const {id,source,groups} of after)assert.deepEqual(groups.flatMap(group=>group.phrases).sort(),source.slice().sort(),`${id}: edits/favorites/recent remain reachable after reload`);
    await page.evaluate(()=>removePhrase('food','Can I show you my order on this screen?'));
    assert.equal(await page.evaluate(()=>phrasesFor('food').includes('Can I show you my order on this screen?')),false);
    await choose('work');
    await page.getByRole('button',{name:'Assistive tech & access',exact:true}).click();
    assert(await page.getByRole('button',{name:'Could I try this with eye tracking or a switch?',exact:true}).isVisible());
    await choose('starred');
    assert.deepEqual(await page.locator('.book-button').allTextContents(),['Eating out','Right now','Unlisted favorite for the weekend.']);
    await choose('recent');assert.deepEqual(await page.locator('.book-button').allTextContents(),['Eating out','Unlisted recent phrase about tomorrow.']);
    await choose('now');await page.getByRole('button',{name:'Speech & listening',exact:true}).click();
    const ordered=await page.locator('.nested-phrase').allTextContents();
    assert.deepEqual(ordered.slice(0,2),['Could you slow down a little for me?',"Give me a second and I'll get there."]);
    // All phrases keeps the full, saved order; the labels only affect grouped navigation.
    await page.locator('#layoutAll').click();
    const full=await page.evaluate(()=>phrasesFor('now'));
    assert.deepEqual(await page.locator('.tile').evaluateAll(tiles=>tiles.map(tile=>[...tile.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join(''))),full);
    await page.locator('#layoutGrouped').click();
    const screenshots=await fs.mkdtemp(path.join(os.tmpdir(),'speechy-groups-'));
    for(const [name,width,height] of [['desktop',1280,900],['ipad',1024,768],['phone',390,844],['small-phone',320,780]]){
      await page.setViewportSize({width,height});await choose('work');
      assert.deepEqual(await page.locator('.book-button').allTextContents(),['Legal practice & experience','Meetings & contact','Documents & follow-up','Decisions & deadlines','Assistive tech & access']);
      assert.equal(await page.locator('.content').evaluate(element=>element.scrollWidth<=element.clientWidth),true,`${name}: no horizontal overflow`);
      for(const button of await page.locator('.book-button').all()){
        assert.equal(await button.evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight),true,`${name}: group title fits`);
      }
      await page.screenshot({path:path.join(screenshots,`${name}.png`)});
    }
    await page.locator('#layoutQuick').click();
    const slots = page.locator('.quick-board .quick-phrase');
    const initialSlots = await slots.allTextContents();
    assert.equal(initialSlots.length,6);
    assert.equal(await slots.first().innerText(),'Please let me finish what I was saying.');
    const positions = await slots.evaluateAll(buttons=>buttons.map(button=>[button.offsetLeft,button.offsetTop]));
    assert.equal(new Set(positions.map(([x])=>x)).size,2);
    assert.equal(new Set(positions.map(([,y])=>y)).size,3);
    await page.locator('#modeBuild').click();
    await slots.first().press('Enter');
    assert.equal(await page.locator('#saidText').innerText(),initialSlots[0]);
    await page.getByRole('button',{name:'Edit slots',exact:true}).click();
    await page.getByLabel('Slot 2',{exact:true}).selectOption('Could I see a menu, please?');
    await page.locator('#setClose').click();
    await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Saved on this device');
    await page.reload();await ready();
    initialSlots[1]='Could I see a menu, please?';
    assert.deepEqual(await slots.allTextContents(),initialSlots);
    await page.getByRole('button',{name:'More phrases',exact:true}).click();
    assert.equal(await page.locator('#layoutGrouped').getAttribute('aria-pressed'),'true');
    assert.deepEqual(errors,[],'no runtime errors');
    console.log('PASS: content titles, previews/heading/back, complete phrase coverage, edited/custom/favorite/recent phrases, saved order, All phrases unchanged, desktop/iPad/phone title fit.');
    console.log('Group screenshots:',screenshots);
  }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
