const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {webcrypto:crypto}=require('node:crypto');
const context={window:{addEventListener(){}},document:{addEventListener(){},getElementById(){}},crypto,Blob,btoa,atob,Uint8Array,setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','storage.js'),'utf8'),context);
context.SpeechyStorage=context.window.SpeechyStorage;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','backup.js'),'utf8'),context);
const backup=context.window.SpeechyBackup;
const gif=new Blob([Uint8Array.from(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64'))],{type:'image/gif'});
const sample=()=>({custom:{now:['Hello','Goodbye']},settings:{theme:'dark'},starred:[],removed:{},counts:{},gifs:{},phraseOrder:{},gifUploads:{Hello:'old-key',Goodbye:'old-key'},phraseSizes:{Hello:2}});
const plain=value=>JSON.parse(JSON.stringify(value));
test('portable backup round-trips board and shared uploaded GIFs to fresh keys',async()=>{
 let readCount=0;const file=await backup.create(sample(),async key=>{assert.equal(key,'old-key');readCount++;return gif;});assert.equal(readCount,1);
 const parsed=await backup.parse(file),writes=[];const restored=await backup.restore(parsed,async(key,blob)=>writes.push([key,Buffer.from(await blob.arrayBuffer())]));
 assert.equal(writes.length,1);assert.notEqual(restored.gifUploads.Hello,'old-key');assert.equal(restored.gifUploads.Hello,restored.gifUploads.Goodbye);
 assert.deepEqual(writes[0][1],Buffer.from(await gif.arrayBuffer()));assert.deepEqual(plain(restored.starred),[]);assert.equal(restored.settings.theme,'dark');assert.equal(sample().gifUploads.Hello,'old-key');
});
test('download refuses an incomplete backup if a referenced GIF is missing',async()=>{
 await assert.rejects(backup.create(sample(),async()=>undefined),/could not be read/);
});
test('restore refuses missing or corrupt GIFs before any board mutation',async()=>{
 const file=await backup.create(sample(),async()=>gif),content=JSON.parse(await file.text());
 content.images=[];await assert.rejects(backup.parse(new Blob([JSON.stringify(content)])),/missing an uploaded GIF/);
 content.images=[{key:'old-key',type:'image/gif',data:btoa('not an image')}];await assert.rejects(backup.parse(new Blob([JSON.stringify(content)])),/Invalid GIF/);
});
test('unknown formats, oversized files and unsafe data are rejected',async()=>{
 await assert.rejects(backup.parse(new Blob(['{}'])),/supported Speechy/);
 await assert.rejects(backup.parse({size:151*1024*1024}),/smaller than 150/);
 await assert.rejects(backup.parse(new Blob(['{"format":"speechy-backup","version":1,"board":{"custom":{"now":"bad"}},"images":[]}'])),/Invalid phrase list/);
 await assert.rejects(backup.parse(new Blob(['{"format":"speechy-backup","version":1,"board":{"settings":{"__proto__":{}}},"images":[]}'])),/Invalid board key/);
});
test('failed upload restoration leaves the source backup untouched',async()=>{
 const parsed=await backup.parse(await backup.create(sample(),async()=>gif));
 await assert.rejects(backup.restore(parsed,async()=>{throw Error('Storage full');}),/Storage full/);
 assert.equal(parsed.board.gifUploads.Hello,'old-key');
});
