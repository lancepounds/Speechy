const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto:crypto}=require('node:crypto');
const {IDBFactory}=require('fake-indexeddb');
const source=fs.readFileSync(path.join(__dirname,'..','storage.js'),'utf8');
const KEY='speechy:board:v1';
const sample=(text='My phrase')=>({custom:{now:[text]},removed:{},starred:[],settings:{uiStyle:'classic',rate:0.8},gifUploads:{},gifs:{},counts:{},phraseOrder:{now:[text]},phraseSizes:{[text]:2}});
function environment({local=new Map(),factory=new IDBFactory(),denyRead=false,denyWrite=false,denyDb=false,abortWrite=false}={}){
 const state={local,factory,denyRead,denyWrite,denyDb,abortWrite};
 const statuses=new Map(),events=new Map();
 const indexedDB={open(...args){
   if(state.denyDb)throw Error('Database temporarily blocked');
   const request=factory.open(...args);
   request.addEventListener('success',()=>{
     const db=request.result,transaction=db.transaction.bind(db);
     db.transaction=(...args)=>{const tx=transaction(...args);if(state.abortWrite && args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx;};
   });
   return request;
 }};
 const context={window:{indexedDB,addEventListener:(name,fn)=>events.set(name,fn)},indexedDB,crypto,structuredClone,setTimeout,clearTimeout,console,
   document:{getElementById:id=>{if(!statuses.has(id))statuses.set(id,{dataset:{}});return statuses.get(id);},addEventListener:(name,fn)=>events.set(name,fn)},
   localStorage:{getItem:k=>{if(state.denyRead)throw Error('Read blocked');return local.get(k)||null;},setItem:(k,v)=>{if(state.denyWrite)throw Error('Quota exceeded');local.set(k,v);}}};
 vm.runInNewContext(source,context);
 return {api:context.window.SpeechyStorage,state,events,status:()=>statuses.get('saveStatus')};
}
async function read(factory,key='main'){
 const db=await new Promise((resolve,reject)=>{const r=factory.open('speechy-board',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('board','readonly'),r=tx.objectStore('board').get(key);tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
}
async function seed(factory,values){
 const r=factory.open('speechy-board',1);r.onupgradeneeded=()=>r.result.createObjectStore('board');
 const db=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise((resolve,reject)=>{const tx=db.transaction('board','readwrite');for(const [key,value]of Object.entries(values))tx.objectStore('board').put(value,key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
}
const plain=value=>JSON.parse(JSON.stringify(value));
test('legacy migration preserves an empty favorites list and writes no defaults on load',async()=>{
 const local=new Map([['aac:board',JSON.stringify(sample())]]),e=environment({local});
 assert.deepEqual(plain(await e.api.load()),sample());assert(!local.has(KEY));
 const pending=e.api.save(sample('Edited'));
 assert.equal(JSON.parse(local.get(KEY)).data.custom.now[0],'Edited','recovery journal writes before save returns');
 assert(await pending);assert.equal((await read(e.state.factory)).data.custom.now[0],'Edited');
});
test('a fresh window can recover an edit immediately, before the database write finishes',async()=>{
 const local=new Map([['aac:board',JSON.stringify(sample())]]),e=environment({local});await e.api.load();
 const pending=e.api.save(sample('Close immediately'));
 const next=environment({local,factory:e.state.factory});assert.equal((await next.api.load()).custom.now[0],'Close immediately');await pending;
});
test('ordered writes keep latest data and a previous checkpoint; reopening is read-only',async()=>{
 const e=environment();await e.api.load();
 await Promise.all(Array.from({length:15},(_,i)=>e.api.save(sample(String(i)))));
 assert.equal((await read(e.state.factory)).data.custom.now[0],'14');assert.equal((await read(e.state.factory,'previous')).data.custom.now[0],'13');
 const before=await read(e.state.factory);const next=environment({local:e.state.local,factory:e.state.factory});await next.api.load();assert.deepEqual(await read(e.state.factory),before);
 const previous=e.api.previous();previous.custom.now[0]='mutated';assert.equal(e.api.previous().custom.now[0],'13');
});
test('failed writes remain visibly unsaved and retry preserves the latest edit',async()=>{
 const e=environment();await e.api.load();await e.api.save(sample('First'));
 e.state.denyWrite=true;e.state.abortWrite=true;
 assert.equal(await e.api.save(sample('Keep this')),false);assert.equal(e.status().dataset.failed,'true');
 let warned=false;e.events.get('beforeunload')({preventDefault:()=>warned=true});assert(warned);
 assert.equal((await read(e.state.factory)).data.custom.now[0],'First');
 e.state.denyWrite=false;e.state.abortWrite=false;assert(await e.api.retry());assert.equal((await read(e.state.factory)).data.custom.now[0],'Keep this');
});
test('a local recovery copy survives database failure and is committed on retry',async()=>{
 const e=environment();await e.api.load();e.state.abortWrite=true;
 assert(await e.api.save(sample('Recovery')));assert(e.status().textContent.includes('recovery copy'));
 const next=environment({local:e.state.local,factory:e.state.factory});assert.equal((await next.api.load()).custom.now[0],'Recovery');
 e.state.abortWrite=false;assert(await e.api.retry());assert.equal((await read(e.state.factory)).data.custom.now[0],'Recovery');
});
test('database saving still works if local writes run out of quota',async()=>{
 const e=environment({denyWrite:true});await e.api.load();assert(await e.api.save(sample()));assert.equal(e.status().textContent,'Saved on this device');
 const next=environment({denyRead:true,denyWrite:true,factory:e.state.factory});assert.deepEqual(plain(await next.api.load()),sample());
});
test('an unreadable database is not assumed empty because localStorage is empty',async()=>{
 const e=environment({denyDb:true});await assert.rejects(e.api.load());assert.equal(await e.api.save(sample()),false);assert(!e.state.local.has(KEY));
 e.state.denyDb=false;await e.api.load();assert(await e.api.save(sample('After retry')));
});
test('damaged main copies recover the previous committed board and remain saveable',async()=>{
 const factory=new IDBFactory(),old={id:'old',savedAt:10,data:sample('Recovered')};await seed(factory,{main:{savedAt:20,data:{custom:{now:'broken'}}},previous:old});
 const local=new Map([[KEY,'{bad json'],[KEY+':previous',JSON.stringify(old)]]),e=environment({local,factory});
 assert.equal((await e.api.load()).custom.now[0],'Recovered');assert(e.status().textContent.includes('Recovered'));
 assert(await e.api.save(sample('Recovered and edited')));assert.equal((await read(factory)).data.custom.now[0],'Recovered and edited');
});
test('a confirmed file restore can recover when every local save is unreadable',async()=>{
 const factory=new IDBFactory(),broken={savedAt:20,data:{custom:{now:'broken'}}};await seed(factory,{main:broken});
 const local=new Map([[KEY,'{damaged']]),e=environment({local,factory});await assert.rejects(e.api.load());
 assert(await e.api.restore(sample('From a portable file')));assert.equal((await read(factory)).data.custom.now[0],'From a portable file');
 assert.deepEqual(await read(factory,'unreadable'),broken);assert.equal(local.get(KEY+':unreadable'),'{damaged');
});
test('invalid saves and malformed phrase lists never replace known-good data',async()=>{
 const e=environment();await e.api.load();await e.api.save(sample());const before=e.state.local.get(KEY);
 assert.equal(await e.api.save({custom:{now:'wrong'}}),false);assert.equal(e.state.local.get(KEY),before);
 assert.throws(()=>e.api.valid(JSON.parse('{"settings":{"__proto__":{"bad":true}}}')));
});
test('a stale window cannot replace changes saved in another window',async()=>{
 const local=new Map(),factory=new IDBFactory(),a=environment({local,factory}),b=environment({local,factory});await a.api.load();await b.api.load();
 await a.api.save(sample('Window A'));assert.equal(await b.api.save(sample('Window B')),false);assert(b.status().textContent.includes('Another Speechy window'));
 assert.equal((await read(factory)).data.custom.now[0],'Window A');
});
test('atomic database comparison also rejects stale writes when local journals are unavailable',async()=>{
 const factory=new IDBFactory();await seed(factory,{main:{id:'initial',savedAt:10,data:sample()}});
 const a=environment({factory,denyWrite:true}),b=environment({factory,denyWrite:true});await a.api.load();await b.api.load();
 await a.api.save(sample('A'));assert.equal(await b.api.save(sample('B')),false);assert.equal((await read(factory)).data.custom.now[0],'A');
});
test('all inline scripts parse',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
