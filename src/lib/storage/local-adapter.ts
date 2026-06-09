import { readLocalFile, writeLocalFile } from "./local-storage";
import type { StorageAdapter } from "./types";

export const localStorageAdapter: StorageAdapter = {
  async write(relativePath, data) {
    const stored = await writeLocalFile(relativePath, data);
    return {
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
    };
  },
  async read(relativePath) {
    return readLocalFile(relativePath);
  },
};
