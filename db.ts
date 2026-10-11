import { Song, Playlist } from '../types/music';

const DB_NAME = 'PureMusicPlayerDB';
const DB_VERSION = 2;
const SONGS_STORE = 'songs';
const PLAYLISTS_STORE = 'playlists';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        const store = db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        store.createIndex('addedAt', 'addedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
      }

      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        const pStore = db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
        pStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Songs methods
export async function getAllSongsFromDB(): Promise<Song[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SONGS_STORE], 'readonly');
      const store = transaction.objectStore(SONGS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as Song[]) || [];
        results.sort((a, b) => b.addedAt - a.addedAt);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get songs from IndexedDB', error);
    return [];
  }
}

export async function saveSongToDB(song: Song): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.put(song);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveMultipleSongsToDB(songs: Song[]): Promise<void> {
  if (songs.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const song of songs) {
      store.put(song);
    }
  });
}

export async function deleteSongFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Playlists methods
export async function getAllPlaylistsFromDB(): Promise<Playlist[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as Playlist[]) || [];
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get playlists from IndexedDB', error);
    return [];
  }
}

export async function savePlaylistToDB(playlist: Playlist): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    const request = store.put(playlist);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylistFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
