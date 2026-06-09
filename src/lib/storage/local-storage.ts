import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

export function getUploadRoot(): string {
  return (
    process.env.UPLOAD_DIR ??
    path.join(process.cwd(), "storage", "uploads")
  );
}

export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function writeLocalFile(
  relativePath: string,
  data: Buffer
): Promise<{ storageKey: string; relativePath: string; absolutePath: string }> {
  const root = getUploadRoot();
  const absolutePath = path.join(root, relativePath);
  await ensureDir(path.dirname(absolutePath));
  await writeFile(absolutePath, data);
  const storageKey = relativePath.replace(/\\/g, "/");
  return { storageKey, relativePath: storageKey, absolutePath };
}

export async function readLocalFile(relativePath: string): Promise<Buffer> {
  const root = getUploadRoot();
  return readFile(path.join(root, relativePath));
}
