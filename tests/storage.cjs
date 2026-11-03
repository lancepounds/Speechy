const vm=require('vm'),fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','storage.js'),'utf8');
function setup({local=new Map(),db=new Map(),denyLocal=false,denyDB=false,abortWrite=false}={}){
 const status={dataset:{}};
 const database={transaction(name,mode){const tx={},req={};tx.objectStore=()=>({get(key){setImmediate(()=>{req.result=db.get(key);tx.oncomplete()});return req},put(value,key){setImmediate(()=>{if(abortWrite){tx.onabort();return}db.set(key,value);tx.oncomplete()});return req}});return tx}};
 const indexedDB={open(){const req={};setImmediate(()=>{if(denyDB){req.error=Error('blocked');req.onerror()}else{req.result=database;req.onsuccess()}});return req}};
 const localStorage={getItem:k=>{if(denyLocal)throw Error();return local.get(k)||null},setItem:(k,v)=>{if(denyLocal)throw Error();local.set(k,v)}};
 const window={indexedDB},context={window,indexedDB,localStorage,document:{getElementById:()=>status},setTimeout,clearTimeout,console};
 vm.runInNewContext(source,context);return {api:window.SpeechyStorage,status,local,db};
}
(async()=>{
 const payload={custom:{now:['Test phrase']},starred:['Test phrase'],settings:{uiStyle:'classic',rate:0.8},gifUploads:{'Test phrase':'gif:1'},gifs:{},phraseOrder:{now:['Test phrase']},phraseSizes:{'Test phrase':2}};
 let e=setup({local:new Map([['aac:board',JSON.stringify(payload)]])});assert.equal(JSON.stringify(await e.api.load()),JSON.stringify(payload));
 const write=e.api.save(payload);assert(e.local.has('speechy:board:v1'),'journal must be synchronous');
 const reopen=setup({local:e.local,db:e.db});assert.equal(JSON.stringify(await reopen.api.load()),JSON.stringify(payload));await write;
 e.local.clear();assert.equal(JSON.stringify(await setup({db:e.db}).api.load()),JSON.stringify(payload));
 let a={...payload,custom:{now:['Earlier']}},b={...payload,custom:{now:['Latest']}};await Promise.all([e.api.save(a),e.api.save(b)]);assert.equal(e.db.get('main').data.custom.now[0],'Latest');
 e=setup({denyDB:true});await e.api.load();assert(await e.api.save(payload));assert.equal(e.status.textContent,'Saved on this device');
 e=setup({denyLocal:true});await e.api.load();assert(await e.api.save(payload));
 e=setup({denyLocal:true,abortWrite:true});await e.api.load();assert.equal(await e.api.save(payload),false);assert.equal(e.status.dataset.failed,'true');
 e=setup({local:new Map([['aac:board','{broken']])});await assert.rejects(e.api.load());assert(e.status.textContent.includes('will not overwrite'));
 e=setup({denyLocal:true,denyDB:true});await assert.rejects(e.api.load());
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');for(const s of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
 console.log('PASS: legacy migration; immediate-close recovery; database recovery; latest-save ordering; local/database fallback; failed-write warning; corrupt/unavailable data protection; inline syntax.');
})();
