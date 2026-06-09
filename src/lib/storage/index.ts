import { localStorageAdapter } from "./local-adapter";
import type { StorageAdapter } from "./types";

/** Varsayılan depolama — ileride S3 vb. için adapter değiştirilebilir */
export function getStorageAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return localStorageAdapter;
  return localStorageAdapter;
}

export type { StorageAdapter, StoredFileRef } from "./types";
