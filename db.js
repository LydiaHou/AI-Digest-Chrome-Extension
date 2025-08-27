// Minimal IndexedDB helper for transcripts and summaries

const DB_NAME = 'vibe_db';
const DB_VERSION = 1;
const STORE_TRANSCRIPTS = 'transcripts';
const STORE_SUMMARIES = 'summaries';

export async function openDb(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TRANSCRIPTS)) {
        db.createObjectStore(STORE_TRANSCRIPTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SUMMARIES)) {
        db.createObjectStore(STORE_SUMMARIES, { keyPath: 'id' });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveTranscript(item){
  const db = await openDb();
  return txPut(db, STORE_TRANSCRIPTS, item);
}

export async function saveSummary(item){
  const db = await openDb();
  return txPut(db, STORE_SUMMARIES, item);
}

export async function searchSummaries(query){
  const db = await openDb();
  return txScan(db, STORE_SUMMARIES, (it) =>
    (it.title||'').toLowerCase().includes(query.toLowerCase()) ||
    (it.summary||'').toLowerCase().includes(query.toLowerCase())
  );
}

function txPut(db, store, item){
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function txScan(db, store, predicate){
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).openCursor();
    const results = [];
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (predicate(cursor.value)) results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}


