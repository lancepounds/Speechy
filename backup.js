/* A portable board backup includes the actual uploaded GIFs, not device-only keys. */
window.SpeechyBackup = (() => {
  const MAX_IMAGE = 15 * 1024 * 1024;
  const MAX_FILE = 150 * 1024 * 1024;
  function completeBoard(board) {
    SpeechyStorage.valid(board);
    for (const key of ['custom','removed','counts','starred','settings','gifs','gifUploads','phraseOrder','phraseSizes']) {
      if (!Object.prototype.hasOwnProperty.call(board, key)) throw Error('This backup is missing board data. Your board has not been changed.');
    }
    return board;
  }
  async function encode(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = '';
    for (let i = 0; i < bytes.length; i += 32768) text += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(text);
  }
  function decode(image) {
    if (!image || typeof image.key !== 'string' || image.type !== 'image/gif' || typeof image.data !== 'string' || image.data.length > Math.ceil(MAX_IMAGE / 3) * 4) throw Error('Invalid GIF in backup.');
    let bytes;
    try { bytes = Uint8Array.from(atob(image.data), character => character.charCodeAt(0)); }
    catch (_) { throw Error('Unreadable GIF in backup.'); }
    const header = String.fromCharCode(...bytes.subarray(0, 6));
    if (!['GIF87a','GIF89a'].includes(header) || bytes.length > MAX_IMAGE) throw Error('Invalid GIF in backup.');
    return new Blob([bytes], {type:'image/gif'});
  }
  async function create(board, readImage) {
    completeBoard(board);
    const images = [];
    for (const key of new Set(Object.values(board.gifUploads || {}))) {
      const blob = await readImage(key);
      if (!blob) throw Error('An uploaded GIF could not be read. Retry before downloading a complete backup.');
      const image = {key, type:'image/gif', data:await encode(blob)};
      decode(image); // Verify that every included upload can be restored.
      images.push(image);
    }
    const text = JSON.stringify({format:'speechy-backup', version:1, createdAt:new Date().toISOString(), board, images});
    const file = new Blob([text], {type:'application/json'});
    if (file.size > MAX_FILE) throw Error('This backup is too large. Remove unused GIFs and try again.');
    return file;
  }
  async function parse(file) {
    if (!file || file.size > MAX_FILE) throw Error('Choose a Speechy backup smaller than 150 MB.');
    let content;
    try { content = JSON.parse(await file.text()); } catch (_) { throw Error('This backup file could not be read.'); }
    if (content?.format !== 'speechy-backup' || content.version !== 1 || !Array.isArray(content.images)) throw Error('Choose a supported Speechy backup file.');
    const board = JSON.parse(JSON.stringify(completeBoard(content.board)));
    const images = new Map();
    for (const image of content.images) {
      if (images.has(image?.key)) throw Error('Duplicate GIF in backup.');
      images.set(image.key, decode(image));
    }
    for (const key of Object.values(board.gifUploads || {})) {
      if (!images.has(key)) throw Error('This backup is missing an uploaded GIF. Your board has not been changed.');
    }
    return {board, images};
  }
  async function restore(parsed, writeImage) {
    const board = JSON.parse(JSON.stringify(SpeechyStorage.valid(parsed.board)));
    const replacements = new Map();
    for (const oldKey of new Set(Object.values(board.gifUploads || {}))) {
      const key = 'gif:' + crypto.randomUUID();
      const image = parsed.images.get(oldKey);
      if (!image) throw Error('Missing GIF in backup.');
      await writeImage(key, image);
      replacements.set(oldKey, key);
    }
    for (const phrase of Object.keys(board.gifUploads || {})) board.gifUploads[phrase] = replacements.get(board.gifUploads[phrase]);
    return board;
  }
  return {create, parse, restore};
})();
