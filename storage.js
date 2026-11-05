/* Local board storage. Keep both a synchronous recovery copy and committed
   IndexedDB records. Never treat an unreadable store as an empty board. */
window.SpeechyStorage = (() => {
  const KEY = 'speechy:board:v1', PREVIOUS = KEY + ':previous';
  let database, opening, queue = Promise.resolve(), latest = 0;
  let loaded = false, conflicted = false, blockedChanges = false, expectedDb = null, expectedLocal = null;
  let current = null, previous = null, pending = null, protectedCopy = false;
  const own = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const token = record => record ? (record.id || 'legacy:' + record.savedAt) : null;
  const report = (message, failed = false) => {
    for (const id of ['saveStatus', 'backupSaveStatus', 'settingsSaveStatus']) {
      const el = document.getElementById(id);
      if (el) { el.textContent = message; el.dataset.failed = String(failed); }
    }
  };
  function valid(value) {
    if (!object(value) || !Object.keys(value).some(key => ['custom','removed','settings','starred','counts','gifs','gifUploads','phraseOrder','phraseSizes'].includes(key))) throw Error('This file does not contain a Speechy board.');
    // Reject unsafe keys before any data is applied to settings or phrase maps.
    function safe(item) {
      if (!item || typeof item !== 'object') return;
      for (const key of Object.keys(item)) {
        if (['__proto__','prototype','constructor'].includes(key)) throw Error('Invalid board key.');
        safe(item[key]);
      }
    }
    safe(value);
    for (const key of ['custom','removed','settings','gifs','gifUploads','counts','phraseOrder','phraseSizes']) {
      if (value[key] !== undefined && !object(value[key])) throw Error('Invalid board field: ' + key);
    }
    for (const key of ['custom','removed','phraseOrder']) {
      for (const list of Object.values(value[key] || {})) {
        if (!Array.isArray(list) || !list.every(p => typeof p === 'string')) throw Error('Invalid phrase list.');
      }
    }
    if (value.starred !== undefined && (!Array.isArray(value.starred) || !value.starred.every(p => typeof p === 'string'))) throw Error('Invalid favorites.');
    for (const key of ['gifs','gifUploads']) {
      if (!Object.values(value[key] || {}).every(p => typeof p === 'string')) throw Error('Invalid GIF references.');
    }
    for (const key of ['counts','phraseSizes']) {
      if (!Object.values(value[key] || {}).every(n => Number.isFinite(n) && n >= 0)) throw Error('Invalid board numbers.');
    }
    const settings = value.settings || {};
    for (const key of ['rate','classicButtonSize','topicWidth','dwellMs']) {
      if (settings[key] !== undefined && !Number.isFinite(settings[key])) throw Error('Invalid setting: ' + key);
    }
    for (const key of ['card','theme','uiStyle']) {
      if (settings[key] !== undefined && typeof settings[key] !== 'string') throw Error('Invalid setting: ' + key);
    }
    if (settings.voiceURI !== undefined && settings.voiceURI !== null && typeof settings.voiceURI !== 'string') throw Error('Invalid voice.');
    for (const key of ['largeTargets','topicsVisible','topicsPinned','dwellEnabled']) {
      if (settings[key] !== undefined && typeof settings[key] !== 'boolean') throw Error('Invalid setting: ' + key);
    }
    return value;
  }
  function record(value) {
    if (!object(value) || !Number.isFinite(value.savedAt) || value.savedAt < 0) throw Error('Invalid save record.');
    valid(value.data);
    return value;
  }
  function open() {
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(Error('Local database unavailable.')); return; }
      let finished = false;
      const request = indexedDB.open('speechy-board', 1);
      const timer = setTimeout(() => { finished = true; reject(Error('Local database is busy.')); }, 4000);
      request.onupgradeneeded = () => request.result.createObjectStore('board');
      request.onsuccess = () => {
        if (finished) { request.result.close(); return; }
        finished = true; clearTimeout(timer); database = request.result;
        const connection=database;
        connection.onversionchange = () => { connection.close(); if(database===connection)database = null; };
        connection.onclose = () => { if(database===connection)database = null; };
        resolve(database);
      };
      request.onerror = () => { finished = true; clearTimeout(timer); reject(request.error); };
    }).finally(() => { opening = null; });
    return opening;
  }
  function readDb() {
    return new Promise((resolve, reject) => {
      const tx = database.transaction('board', 'readonly');
      const main = tx.objectStore('board').get('main'), old = tx.objectStore('board').get('previous');
      tx.oncomplete = () => resolve([main.result, old.result]);
      tx.onerror = tx.onabort = () => reject(tx.error || Error('Read transaction aborted.'));
    });
  }
  function conflict() {
    conflicted = true;
    report('Another Speechy window saved changes. Download a backup of this window before reloading.', true);
  }
  function journal(value) {
    try {
      let head = null;
      const text = localStorage.getItem(KEY);
      try { if(text)head = record(JSON.parse(text)); } catch (_) {
        try { localStorage.setItem(KEY + ':unreadable', text); } catch (_) {}
      }
      if (token(head) !== expectedLocal && head && !own.has(token(head))) { conflict(); return false; }
      // Preserve a known-good previous version, never damaged bytes.
      if (current && token(current) !== token(value)) {
        try { localStorage.setItem(PREVIOUS, JSON.stringify(current)); } catch (_) {}
      }
      localStorage.setItem(KEY, JSON.stringify(value));
      expectedLocal = token(value);
      return true;
    } catch (_) { return false; }
  }
  async function writeDb(value) {
    await open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('board', 'readwrite'), store = tx.objectStore('board');
      const request = store.get('main'); let stale = false, failure;
      request.onsuccess = () => {
        const original = request.result; let head = original;
        try { if(head) record(head); } catch (_) { head = null; }
        if (head && token(head) !== expectedDb && !own.has(token(head))) {
          // A different window has committed since this window loaded.
          stale = true; tx.abort(); return;
        }
        try {
          if (token(head) !== token(value)) {
            if (head) store.put(head, 'previous');
            else if (original) store.put(original, 'unreadable');
            store.put(value, 'main');
          }
        } catch(error) { failure=error; tx.abort(); }
      };
      tx.oncomplete = () => { expectedDb = token(value); resolve(); };
      tx.onerror = tx.onabort = () => { if (stale) conflict(); reject(failure || tx.error || Error(stale ? 'Newer save in another window.' : 'Save transaction aborted.')); };
    });
  }
  async function load() {
    await queue.catch(() => {});
    const candidates = []; let failed = false, found = false;
    let localHead = null, dbHead = null;
    for (const key of [KEY, PREVIOUS, 'aac:board']) {
      try {
        const text = localStorage.getItem(key);
        if (!text) continue;
        found = true;
        const entry = key === 'aac:board' ? {savedAt:0, data:valid(JSON.parse(text))} : record(JSON.parse(text));
        candidates.push({entry, fallback:key !== KEY});
        if (key === KEY) localHead = entry;
      } catch (_) { failed = true; }
    }
    if (window.indexedDB) {
      try {
        await open();
        const rows = await readDb();
        rows.forEach((row, index) => {
          if (!row) return;
          found = true;
          try { record(row); candidates.push({entry:row, fallback:index > 0}); if (!index) dbHead = row; }
          catch (_) { failed = true; }
        });
      } catch (_) { failed = true; }
    }
    if (!candidates.length && (failed || found)) {
      loaded = false;
      report('Saved board could not be opened. Tap Saving & backups to retry. Existing data is protected.', true);
      throw Error('Saved data unavailable.');
    }
    candidates.sort((a,b) => b.entry.savedAt - a.entry.savedAt || Number(a.fallback) - Number(b.fallback));
    current = candidates[0]?.entry || null;
    previous = candidates.find(item => current && item.entry.savedAt < current.savedAt)?.entry || null;
    expectedLocal = token(localHead); expectedDb = token(dbHead);
    latest = current?.savedAt || 0; pending = null; protectedCopy = !!current;
    loaded = true; conflicted = false; blockedChanges = false;
    if (current) own.add(token(current));
    const recovered = candidates[0]?.fallback;
    report(recovered ? 'Recovered a saved copy. Check your board and download a backup.' : current ? 'Saved board loaded on this device' : 'Ready to save on this device');
    return current ? clone(current.data) : null;
  }
  function commit(value) {
    const promise = queue.catch(() => {}).then(async () => {
      if (conflicted) return false;
      let committed = false;
      try { await writeDb(value); committed = true; } catch (_) {}
      if (conflicted) return false;
      if (pending === value) {
        protectedCopy = protectedCopy || committed;
        if (committed) { pending = null; report('Saved on this device'); }
        else if (protectedCopy) report('Saved recovery copy on this device. Tap Saving & backups to retry.');
        else report('Not saved — storage is unavailable or full. Keep Speechy open. Retry or download a backup.', true);
      }
      return committed || (pending === value && protectedCopy);
    });
    queue = promise;
    return promise;
  }
  function save(data) {
    if (!loaded || conflicted) {
      blockedChanges = true;
      if (!conflicted) report('Saving is paused to protect existing data. Tap Saving & backups to retry opening it.', true);
      return Promise.resolve(false);
    }
    let copy;
    try { copy = clone(valid(data)); } catch (error) { blockedChanges = true; report(error.message, true); return Promise.resolve(false); }
    const value = {id:crypto.randomUUID(), savedAt:Math.max(Date.now(), latest + 1), data:copy};
    latest = value.savedAt; own.add(value.id); blockedChanges = false;
    const journalSaved = journal(value);
    if (conflicted) { blockedChanges = true; return Promise.resolve(false); }
    if (current && JSON.stringify(current.data) !== JSON.stringify(copy)) previous = current;
    current = value; pending = value; protectedCopy = journalSaved;
    report('Saving on this device…');
    return commit(value);
  }
  // Called only after the user validates and confirms a portable-file restore.
  // Unlike an ordinary save, this can recover from a failed initial read.
  async function restore(data) {
    valid(data);
    if (!loaded && !conflicted) {
      await queue.catch(() => {});
      try {
        const text=localStorage.getItem(KEY);
        const head=text ? record(JSON.parse(text)) : null;
        expectedLocal=token(head);
        if(head) { current=head; latest=Math.max(latest,head.savedAt); }
      } catch (_) {}
      try {
        await open(); const rows=await readDb();
        if(rows[0]) {
          const head=record(rows[0]); expectedDb=token(head);
          if(!current || head.savedAt>current.savedAt)current=head;
          latest=Math.max(latest,head.savedAt);
        }
      } catch (_) {}
      loaded=true;
    }
    return save(data);
  }
  function retry() {
    if (conflicted || !loaded) return Promise.resolve(false);
    if (!pending) return queue.then(() => !blockedChanges);
    const value = pending;
    protectedCopy = journal(value) || protectedCopy;
    return conflicted ? Promise.resolve(false) : commit(value);
  }
  window.addEventListener('storage', event => {
    if (event.key !== KEY || !loaded || !event.newValue) return;
    try { const other = record(JSON.parse(event.newValue)); if (!own.has(token(other)) && token(other) !== expectedLocal) conflict(); } catch (_) {}
  });
  window.addEventListener('online', () => { retry(); });
  window.addEventListener('pagehide', () => { retry(); });
  document.addEventListener('visibilitychange', () => { retry(); });
  window.addEventListener('beforeunload', event => {
    if (blockedChanges || (pending && !protectedCopy)) { event.preventDefault(); event.returnValue = ''; }
  });
  return {load, save, restore, retry, valid, report,
    previous:() => previous ? clone(previous.data) : null,
    canSave:() => loaded && !conflicted, canRestore:() => !conflicted};
})();

