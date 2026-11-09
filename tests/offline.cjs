const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const listeners={},items=new Map();let fail=false,stall=false,cacheName;
const cache={addAll:async requests=>requests.forEach(r=>items.set(r.url,{cached:true})),put:async(u,r)=>items.set(u,r),match:async u=>items.get(u)};
const ctx={URL,Request,AbortController,setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,5)),clearTimeout,self:{location:{href:'https://example.com/Speechy/sw.js'},addEventListener:(n,f)=>listeners[n]=f,clients:{claim:async()=>{}}},caches:{open:async n=>{cacheName=n;return cache},keys:async()=>['another-app','speechy-shell-v11'],delete:async k=>assert.equal(k,'speechy-shell-v11')},fetch:async(r,options)=>{if(stall)return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))));return {ok:!fail,status:503,clone(){return this}}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),ctx);
(async()=>{let pending;listeners.install({waitUntil:p=>pending=p});await pending;assert.equal(items.size,8);assert(items.has('https://example.com/Speechy/storage.js'));assert.equal(cacheName,'speechy-shell-v16');listeners.activate({waitUntil:p=>pending=p});await pending;
for(const kind of ['server-error','timeout']){fail=kind==='server-error';stall=kind==='timeout';for(const path of ['/Speechy/','/Speechy/index.html','/Speechy/?launch=app','/Speechy/storage.js','/Speechy/backup.js']){listeners.fetch({request:{method:'GET',url:'https://example.com'+path},respondWith:p=>pending=p});assert((await pending).cached)}}
let intercepted=false;listeners.fetch({request:{method:'GET',url:'https://example.com/other-app/'},respondWith:()=>intercepted=true});assert(!intercepted);console.log('PASS: complete offline shell; server-error and stalled-network fallback; query launches; cache upgrade isolation.');})();









