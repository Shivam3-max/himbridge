import 'server-only';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { StorageDriver } from './index';

/** Stores files on the server's disk. In production, mount UPLOAD_DIR on a persistent volume and back it up. */
export function localStorage(dir: string): StorageDriver {
  const root = resolve(dir);
  const pathFor = (key: string) => {
    if (!/^[\w.-]+$/.test(key)) throw new Error(`Invalid storage key: ${key}`);
    return join(root, key);
  };
  return {
    async put(key, data) {
      await mkdir(root, { recursive: true });
      await writeFile(pathFor(key), data);
    },
    async get(key) {
      try {
        return new Uint8Array(await readFile(pathFor(key)));
      } catch {
        return null;
      }
    },
    async delete(key) {
      await unlink(pathFor(key)).catch(() => undefined);
    },
  };
}
