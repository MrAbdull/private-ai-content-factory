import { createHash } from "crypto";
import { readStore, updateStore } from "@/lib/store/local-store";
import type { ContentItem } from "@/types";

function hash(text: string): string {
  return createHash("sha256").update(text.toLowerCase().trim()).digest("hex").slice(0, 16);
}

export interface CopyrightCheck {
  passed: boolean;
  duplicateOf?: string;
  titleHash: string;
  scriptHash: string;
}

export async function checkCopyright(item: ContentItem): Promise<CopyrightCheck> {
  const titleHash = hash(item.title);
  const scriptHash = hash(item.script);
  const hookHash = hash(item.hook);

  const store = await readStore();
  if (!store.fingerprints) store.fingerprints = [];

  const dup = store.fingerprints.find(
    (f) => f.contentId !== item.id && (f.titleHash === titleHash || f.scriptHash === scriptHash)
  );

  if (!dup) {
    await updateStore((s) => {
      if (!s.fingerprints) s.fingerprints = [];
      const idx = s.fingerprints.findIndex((f) => f.contentId === item.id);
      const entry = { contentId: item.id, titleHash, scriptHash, hookHash, createdAt: new Date().toISOString() };
      if (idx >= 0) s.fingerprints[idx] = entry;
      else s.fingerprints.push(entry);
    });
  }

  return {
    passed: !dup,
    duplicateOf: dup?.contentId,
    titleHash,
    scriptHash,
  };
}
