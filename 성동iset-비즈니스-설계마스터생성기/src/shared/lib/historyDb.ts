/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HistoryItem {
  id: number | string; // timestamp or unique string
  tool: string; // activeTab
  output: string; // dataUrl of the generated image/preview
  prompt: string;
  inputs?: {
    // All the context needed to restore
    [key: string]: any;
    inputImages?: string[];
  };
}

const DB_NAME = "CreativeCanvasHistoryDB";
const DB_VERSION = 1;
const STORE_NAME = "historyItems";

let db: IDBDatabase | null = null;

const initDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject("IndexedDB를 여는 데 실패했습니다.");
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        tempDb.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const addHistory = async (item: HistoryItem): Promise<void> => {
  const db = await initDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(item);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllHistory = async (): Promise<HistoryItem[]> => {
  const db = await initDb();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const getAllRequest = store.getAll();

  const getIdTimestamp = (id: number | string) =>
    typeof id === "string" ? parseInt(id.split("-").pop() || "0", 10) : id;

  return new Promise((resolve, reject) => {
    getAllRequest.onsuccess = () => {
      // Sort descending by ID (timestamp part)
      const sorted = getAllRequest.result.sort(
        (a, b) => getIdTimestamp(b.id) - getIdTimestamp(a.id),
      );
      resolve(sorted);
    };
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
};

export const deleteHistory = async (id: number | string): Promise<void> => {
  const db = await initDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const deleteRequest = store.delete(id);

  return new Promise((resolve, reject) => {
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
};
