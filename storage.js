/* Device-local board storage. The synchronous journal protects immediate closes;
   IndexedDB is the durable copy. Existing aac:board data is migrated on load. */
window.SpeechyStorage = (() => {
  const KEY = 'speechy:board:v1';
  let database, queue = Promise.resolve(), latest = 0;
  const report = (message, failed = false) => {
    const el = document.getElementById('saveStatus');
    if (el) { el.textContent = message; el.dataset.failed = String(failed); }
  };
  function open() {
    if (!window.indexedDB) return Promise.reject(Error('IndexedDB unavailable'));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('speechy-board', 1);
      const timer = setTimeout(() => reject(Error('Storage is busy. Close other Speechy windows and reopen.')), 4000);
      request.onupgradeneeded = () => request.result.createObjectStore('board');
      request.onsuccess = () => { clearTimeout(timer); resolve(request.result); };
      request.onerror = () => { clearTimeout(timer); reject(request.error); };
    });
  }
  function access(mode, value) {
    return new Promise((resolve, reject) => {
      const tx = database.transaction('board', mode);
      const request = mode === 'readonly' ? tx.objectStore('board').get('main') : tx.objectStore('board').put(value, 'main');
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(tx.error || Error('Save transaction aborted'));
    });
  }
  function valid(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid saved board');
    for (const key of ['custom','removed','settings','gifs','gifUploads','counts','phraseOrder','phraseSizes']) {
      if (value[key] !== undefined && (!value[key] || typeof value[key] !== 'object' || Array.isArray(value[key]))) throw Error('Invalid board field: ' + key);
    }
    if (value.starred !== undefined && !Array.isArray(value.starred)) throw Error('Invalid favorites');
    return value;
  }
  async function load() {
    const candidates = []; let damaged = false, localReadable = false;
    try {
      for (const key of [KEY, 'aac:board']) {
        const text = localStorage.getItem(key);
        if (text) {
          try {
            const parsed = JSON.parse(text);
            candidates.push(key === KEY ? {savedAt:parsed.savedAt || 0, data:valid(parsed.data)} : {savedAt:0, data:valid(parsed)});
          } catch (_) { damaged = true; }
        }
      }
      localReadable = true;
    } catch (_) {}
    let dbReadable = false, dbReadFailed = false;
    try {
      database = await open();
      let stored;
      try { stored = await access('readonly'); if(stored) valid(stored.data); }
      catch(error) { dbReadFailed = true; throw error; }
      if (stored) candidates.push({savedAt:stored.savedAt || 0, data:valid(stored.data)});
      dbReadable = true;
    } catch (_) {}
    if (!candidates.length && (damaged || dbReadFailed || (!dbReadable && !localReadable))) {
      report('Saved board could not be opened. Changes will not overwrite it. Reopen Speechy to retry.', true);
      throw Error('Saved data unavailable');
    }
    candidates.sort((a,b) => b.savedAt - a.savedAt);
    latest = candidates[0]?.savedAt || 0;
    report(candidates.length ? 'Saved board loaded on this device' : 'Ready to save on this device');
    return candidates[0]?.data || null;
  }
  function save(data) {
    const record = {savedAt:Math.max(Date.now(), latest + 1), data:JSON.parse(JSON.stringify(data))};
    latest = record.savedAt;
    let journalSaved = false;
    try { localStorage.setItem(KEY, JSON.stringify(record)); journalSaved = true; } catch (_) {}
    report('Saving on this device…');
    const pending = queue.catch(() => {}).then(async () => {
      let dbSaved = false;
      if (database) { try { await access('readwrite', record); dbSaved = true; } catch (_) {} }
      if (latest === record.savedAt) report(dbSaved || journalSaved ? 'Saved on this device' : 'Not saved — device storage is unavailable or full. Keep Speechy open and free storage.', !dbSaved && !journalSaved);
      return dbSaved || journalSaved;
    });
    queue = pending;
    return pending;
  }
  return {load, save, report};
})();
