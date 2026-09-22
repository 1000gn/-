/**
 * IndexedDB helper to store and retrieve full-resolution card images (1200x675).
 * Only metadata & imageRef are kept in localStorage to prevent storage overflow.
 */

const DB_NAME = 'WordCardDB';
const DB_VERSION = 1;
const STORE_NAME = 'card_images';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeImageInDb(id: string, dataUrl: string): Promise<string> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id,
      dataUrl,
      updatedAt: new Date().toISOString()
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

export async function getImageFromDb(id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to load image from IndexedDB:', err);
    return null;
  }
}

export async function deleteImageFromDb(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete image from IndexedDB:', err);
  }
}

/**
 * Validates, center-crops, and resizes an uploaded image file to 1200x675 (16:9).
 * - Max size: 5MB
 * - Formats: JPG, PNG, WEBP
 */
export function cropAndResizeImage(file: File): Promise<{ dataUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    // 1. Validation: File size
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE_BYTES) {
      return reject(new Error('파일 크기가 5MB를 초과합니다. 5MB 이하의 이미지를 업로드해 주세요.'));
    }

    // 2. Validation: File type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return reject(new Error('지원하지 않는 파일 형식입니다. JPG, PNG, WEBP 형식만 지원됩니다.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 파싱에 실패했습니다. 유효한 이미지인지 확인해 주세요.'));
      img.onload = () => {
        try {
          const TARGET_WIDTH = 1200;
          const TARGET_HEIGHT = 675; // 16:9 ratio
          const TARGET_ASPECT = TARGET_WIDTH / TARGET_HEIGHT; // 1.7777...

          const imgAspect = img.width / img.height;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          // Center-crop calculations
          if (imgAspect > TARGET_ASPECT) {
            // Image is wider than 16:9 -> crop horizontal sides
            sourceWidth = img.height * TARGET_ASPECT;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            // Image is taller than 16:9 -> crop vertical top/bottom
            sourceHeight = img.width / TARGET_ASPECT;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // Render 1200x675
          const canvas = document.createElement('canvas');
          canvas.width = TARGET_WIDTH;
          canvas.height = TARGET_HEIGHT;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('캔버스 렌더링 컨텍스트를 생성할 수 없습니다.'));
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            TARGET_WIDTH,
            TARGET_HEIGHT
          );

          const fullDataUrl = canvas.toDataURL('image/jpeg', 0.92);

          // Generate lightweight thumbnail (320x180)
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = 320;
          thumbCanvas.height = 180;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (thumbCtx) {
            thumbCtx.imageSmoothingEnabled = true;
            thumbCtx.imageSmoothingQuality = 'medium';
            thumbCtx.drawImage(canvas, 0, 0, 320, 180);
          }
          const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.75);

          resolve({ dataUrl: fullDataUrl, thumbnailUrl });
        } catch (error) {
          reject(new Error('이미지 크롭 및 리사이징 중 오류가 발생했습니다.'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
