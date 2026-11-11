/** The part of the StorageManager that the hub uses. */
export interface PersistApi {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
}

/**
 * Asks the browser to keep the hub data when the device is short of space.
 * It asks one time; a refusal or a missing API is not an error. Returns true when the data is persistent.
 */
export async function requestPersistentStorage(api: PersistApi | undefined): Promise<boolean> {
  try {
    if (!api?.persist) {
      return false;
    }
    if (api.persisted && (await api.persisted())) {
      return true;
    }
    return await api.persist();
  } catch {
    return false;
  }
}
