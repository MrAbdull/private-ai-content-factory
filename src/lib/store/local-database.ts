import type {
  AutomationJob,
  ContentItem,
  ContentSource,
  ContentStatus,
  PerformanceMetrics,
  TrendOpportunity,
  YouTubeChannel,
} from "@/types";
import { generateId, readStore, updateStore } from "./local-store";
import type { BlastOperation, FootageUsageRecord } from "./types";

export async function getChannels(): Promise<YouTubeChannel[]> {
  const store = await readStore();
  return store.channels;
}

export async function getChannel(id: string): Promise<YouTubeChannel | undefined> {
  const store = await readStore();
  return store.channels.find((c) => c.id === id);
}

export async function upsertChannel(channel: YouTubeChannel): Promise<YouTubeChannel> {
  await updateStore((store) => {
    const idx = store.channels.findIndex((c) => c.id === channel.id);
    if (idx >= 0) store.channels[idx] = channel;
    else store.channels.push(channel);
  });
  return channel;
}

export async function getContent(filters?: {
  status?: ContentStatus;
  channelId?: string;
  search?: string;
}): Promise<ContentItem[]> {
  const store = await readStore();
  let items = [...store.content];
  if (filters?.status) items = items.filter((c) => c.status === filters.status);
  if (filters?.channelId) items = items.filter((c) => c.channelId === filters.channelId);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.script.toLowerCase().includes(q)
    );
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getContentById(id: string): Promise<ContentItem | undefined> {
  const store = await readStore();
  return store.content.find((c) => c.id === id);
}

export async function saveContent(item: ContentItem): Promise<ContentItem> {
  await updateStore((store) => {
    const idx = store.content.findIndex((c) => c.id === item.id);
    if (idx >= 0) store.content[idx] = item;
    else store.content.push(item);
  });
  return item;
}

export async function deleteContent(id: string): Promise<void> {
  await updateStore((store) => {
    store.content = store.content.filter((c) => c.id !== id);
  });
}

export async function duplicateContent(id: string): Promise<ContentItem | null> {
  const original = await getContentById(id);
  if (!original) return null;
  const copy: ContentItem = {
    ...structuredClone(original),
    id: generateId("cnt"),
    title: `${original.title} (Copy)`,
    status: "draft",
    scheduledAt: undefined,
    publishedAt: undefined,
    youtubeVideoId: undefined,
    videoUrl: undefined,
    createdAt: new Date().toISOString(),
    versions: original.versions.map((v) => ({
      ...v,
      id: generateId("ver"),
      contentId: "",
      isSelected: false,
    })),
    thumbnails: original.thumbnails.map((t) => ({
      ...t,
      id: generateId("thumb"),
      contentId: "",
      isSelected: false,
    })),
  };
  copy.versions.forEach((v) => { v.contentId = copy.id; });
  copy.thumbnails.forEach((t) => { t.contentId = copy.id; });
  return saveContent(copy);
}

export async function getSources(): Promise<ContentSource[]> {
  const store = await readStore();
  return store.sources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSource(source: ContentSource): Promise<ContentSource> {
  await updateStore((store) => {
    const idx = store.sources.findIndex((s) => s.id === source.id);
    if (idx >= 0) store.sources[idx] = source;
    else store.sources.push(source);
  });
  return source;
}

export async function getMetrics(): Promise<PerformanceMetrics[]> {
  const store = await readStore();
  return store.metrics;
}

export async function saveMetrics(metrics: PerformanceMetrics): Promise<void> {
  await updateStore((store) => {
    const existing = store.metrics.findIndex((m) => m.contentId === metrics.contentId);
    if (existing >= 0) store.metrics[existing] = metrics;
    else store.metrics.push(metrics);
  });
}

export async function getTrends(): Promise<TrendOpportunity[]> {
  const store = await readStore();
  return store.trends;
}

export async function saveTrends(trends: TrendOpportunity[]): Promise<void> {
  await updateStore((store) => {
    store.trends = trends;
  });
}

export async function getJobs(limit = 50): Promise<AutomationJob[]> {
  const store = await readStore();
  return store.jobs.slice(-limit).reverse();
}

export async function addJob(job: AutomationJob): Promise<AutomationJob> {
  await updateStore((store) => {
    store.jobs.push(job);
  });
  return job;
}

export async function updateJob(id: string, patch: Partial<AutomationJob>): Promise<void> {
  await updateStore((store) => {
    const job = store.jobs.find((j) => j.id === id);
    if (job) Object.assign(job, patch);
  });
}

export async function getPendingJobs(): Promise<AutomationJob[]> {
  const store = await readStore();
  return store.jobs.filter((j) => j.status === "pending" || j.status === "retrying");
}

export async function saveBlastOperation(op: BlastOperation): Promise<void> {
  await updateStore((store) => {
    store.blastOperations.push(op);
  });
}

export async function recordFootageUsage(record: FootageUsageRecord): Promise<void> {
  await updateStore((store) => {
    store.footageUsage.push(record);
  });
}

export async function getFootageUsageIds(): Promise<string[]> {
  const store = await readStore();
  return store.footageUsage.map((f) => f.footageId);
}

export async function getReviewQueue(): Promise<ContentItem[]> {
  return getContent({ status: "review" });
}

export async function getScheduledContent(): Promise<ContentItem[]> {
  const store = await readStore();
  return store.content.filter((c) => c.status === "scheduled" || c.status === "published");
}

export async function addEvergreenContent(contentId: string, channelId: string, priority = 0): Promise<void> {
  await updateStore((store) => {
    if (!store.evergreen) store.evergreen = [];
    store.evergreen.push({ contentId, channelId, priority, addedAt: new Date().toISOString() });
  });
}
