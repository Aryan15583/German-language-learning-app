// Browser storage with the small async API the providers use.
// Every call is wrapped: private windows or blocked storage must never crash the app.
const store = (): Storage | null => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return store()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      store()?.setItem(key, value);
    } catch {
      // quota or blocked storage: progress still lives in memory (and in the cloud backup)
    }
  },
  async multiRemove(keys: string[]): Promise<void> {
    try {
      keys.forEach((k) => store()?.removeItem(k));
    } catch {
      // nothing to remove
    }
  },
};

export default Storage;
