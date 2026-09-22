import { type DBSchema, openDB } from "idb";

interface ImageDB extends DBSchema {
  images: {
    key: string;
    value: { id: string; blob: Blob; createdAt: number; tag?: string };
    indexes: { "by-date": number };
  };
}

const dbPromise = openDB<ImageDB>("creative-canvas-vault", 1, {
  upgrade(db) {
    const store = db.createObjectStore("images", { keyPath: "id" });
    store.createIndex("by-date", "createdAt");
  },
});

export async function saveImage(blob: Blob, tag?: string): Promise<string> {
  const id = crypto.randomUUID();
  const db = await dbPromise;
  await db.put("images", { id, blob, createdAt: Date.now(), tag });
  return id;
}

export async function saveDataURL(dataUrl: string, tag?: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  return saveImage(blob, tag);
}

export async function getImageURL(id: string): Promise<string | null> {
  const db = await dbPromise;
  const record = await db.get("images", id);
  return record ? URL.createObjectURL(record.blob) : null;
}

export async function deleteImage(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete("images", id);
}

export async function cleanupOldImages(daysToKeep = 7): Promise<number> {
  const db = await dbPromise;
  const cutoff = Date.now() - daysToKeep * 86_400_000;
  const tx = db.transaction("images", "readwrite");
  let deleted = 0;
  const index = tx.store.index("by-date");
  for await (const cursor of index.iterate()) {
    if (cursor.value.createdAt < cutoff) {
      await cursor.delete();
      deleted++;
    }
  }
  return deleted;
}

export async function getStorageStats() {
  if (!("estimate" in navigator.storage)) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return {
    usedMB: (usage / 1_048_576).toFixed(2),
    quotaMB: (quota / 1_048_576).toFixed(2),
    percent: ((usage / quota) * 100).toFixed(1),
  };
}
