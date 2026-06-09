export type StoredFileRef = {
  storageKey: string;
  relativePath: string;
};

export interface StorageAdapter {
  write(relativePath: string, data: Buffer): Promise<StoredFileRef>;
  read(relativePath: string): Promise<Buffer>;
}
