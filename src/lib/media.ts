import {
  fitWithin,
  meanLuminance,
  PHOTO_MAX_EDGE,
  PHOTO_MAX_INPUT_BYTES,
  PHOTO_MAX_STORED_BYTES,
} from './backdrop';

/**
 * The background photo lives in IndexedDB on this device only.
 * It is never in localStorage and the hub never sends it to a server.
 */
const DB_NAME = 'l90-hub-media';
const DB_VERSION = 1;
export const MEDIA_STORE = 'hub-media';
export const BACKDROP_KEY = 'backdrop';
const SAMPLE_EDGE = 32;
const JPEG_QUALITY = 0.86;

export interface StoredPhoto {
  blob: Blob;
  /** The mean relative luminance of the photo, 0 to 1. */
  luminance: number;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(MEDIA_STORE)) {
          request.result.createObjectStore(MEDIA_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const transaction = db.transaction(MEDIA_STORE, mode);
          const request = action(transaction.objectStore(MEDIA_STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
          transaction.oncomplete = () => db.close();
          transaction.onabort = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      }),
  );
}

function isStoredPhoto(value: unknown): value is StoredPhoto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Partial<StoredPhoto>;
  return record.blob instanceof Blob && typeof record.luminance === 'number';
}

export async function loadPhoto(): Promise<StoredPhoto | null> {
  const value: unknown = await run('readonly', (store) => store.get(BACKDROP_KEY));
  return isStoredPhoto(value) ? value : null;
}

export async function savePhoto(photo: StoredPhoto): Promise<boolean> {
  const result = await run('readwrite', (store) => store.put(photo, BACKDROP_KEY));
  return result !== null;
}

export async function removePhoto(): Promise<boolean> {
  const result = await run('readwrite', (store) => store.delete(BACKDROP_KEY));
  return result !== null;
}

export type PreparedPhoto = { ok: true; photo: StoredPhoto } | { ok: false; error: string };

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', JPEG_QUALITY);
    } catch {
      resolve(null);
    }
  });
}

/** Decodes the file, scales it to 2,560 px on the long edge and measures its mean luminance. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'The file is not an image. Choose a JPEG, PNG, WebP or HEIC photo.' };
  }
  if (file.size > PHOTO_MAX_INPUT_BYTES) {
    return { ok: false, error: 'The photo is larger than 30 MB. Choose a smaller photo.' };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: 'This browser cannot open the photo. Choose a JPEG or PNG photo.' };
  }
  try {
    const size = fitWithin({ width: bitmap.width, height: bitmap.height }, PHOTO_MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    const sample = document.createElement('canvas');
    sample.width = SAMPLE_EDGE;
    sample.height = SAMPLE_EDGE;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    if (!context || !sampleContext) {
      return { ok: false, error: 'This browser cannot prepare the photo.' };
    }
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    sampleContext.drawImage(bitmap, 0, 0, SAMPLE_EDGE, SAMPLE_EDGE);
    const luminance = meanLuminance(sampleContext.getImageData(0, 0, SAMPLE_EDGE, SAMPLE_EDGE).data);
    const blob = await toBlob(canvas);
    if (!blob) {
      return { ok: false, error: 'This browser cannot prepare the photo.' };
    }
    if (blob.size > PHOTO_MAX_STORED_BYTES) {
      return { ok: false, error: 'The photo is too detailed to store. Choose a different photo.' };
    }
    return { ok: true, photo: { blob, luminance } };
  } finally {
    bitmap.close();
  }
}
