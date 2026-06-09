import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { mockChannels, mockContent, mockMetrics, mockTrends, mockJobs } from "@/lib/mock-data";
import type { PlatformStore } from "./types";

const STORE_FILE = "store.json";

function defaultStore(): PlatformStore {
  return {
    channels: [...mockChannels],
    sources: [],
    content: [...mockContent],
    metrics: [...mockMetrics],
    trends: [...mockTrends],
    jobs: [...mockJobs],
    blastOperations: [],
    footageUsage: [],
    evergreen: [],
    fingerprints: [],
    resourceUsage: [],
    crossPostDefaults: ["youtube"],
    version: 1,
  };
}

function storePath(): string {
  return path.join(process.cwd(), config.dataDir, STORE_FILE);
}

async function ensureDir() {
  await fs.mkdir(path.join(process.cwd(), config.dataDir), { recursive: true });
}

let cache: PlatformStore | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function readStore(): Promise<PlatformStore> {
  if (cache) return structuredClone(cache);
  await ensureDir();
  try {
    const raw = await fs.readFile(storePath(), "utf-8");
    cache = JSON.parse(raw) as PlatformStore;
  } catch {
    cache = defaultStore();
    await writeStore(cache);
  }
  return structuredClone(cache!);
}

export async function writeStore(store: PlatformStore): Promise<void> {
  cache = structuredClone(store);
  writeQueue = writeQueue.then(async () => {
    await ensureDir();
    await fs.writeFile(storePath(), JSON.stringify(store, null, 2), "utf-8");
  });
  await writeQueue;
}

export async function updateStore(
  updater: (store: PlatformStore) => void | Promise<void>
): Promise<PlatformStore> {
  const store = await readStore();
  await updater(store);
  await writeStore(store);
  return store;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
