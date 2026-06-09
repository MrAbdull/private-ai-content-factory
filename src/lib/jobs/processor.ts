import { getContent, getContentById, getChannels, saveContent, getJobs, updateJob, addJob } from "@/lib/store/database";
import { publishToYouTube } from "@/lib/youtube/publish";
import { createShortFromTopic } from "@/lib/pipeline/content-pipeline";
import { evergreenQueueEngine } from "@/lib/engines/evergreen-queue";
import { trendDiscoveryEngine } from "@/lib/engines/trend-discovery";
import { saveTrends } from "@/lib/store/database";
import { generateId } from "@/lib/store/local-store";
import type { AutomationJob } from "@/types";

export interface ProcessResult {
  processed: number;
  published: number;
  failed: number;
  details: string[];
}

export async function processScheduledPublishing(): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, published: 0, failed: 0, details: [] };
  const now = new Date();
  const scheduled = (await getContent({ status: "scheduled" })).filter(
    (c) => c.scheduledAt && new Date(c.scheduledAt) <= now
  );

  for (const item of scheduled) {
    result.processed++;
    const jobId = generateId("job");
    await addJob({
      id: jobId,
      type: "publish",
      provider: "local",
      status: "running",
      payload: { contentId: item.id },
      createdAt: new Date().toISOString(),
    });

    try {
      const pub = await publishToYouTube(item);
      item.status = "published";
      item.publishedAt = new Date().toISOString();
      item.youtubeVideoId = pub.videoId;
      await saveContent(item);
      await updateJob(jobId, { status: "completed", completedAt: new Date().toISOString() });
      result.published++;
      result.details.push(`Published: ${item.title}`);
    } catch (e) {
      item.status = "failed";
      await saveContent(item);
      await updateJob(jobId, { status: "failed", completedAt: new Date().toISOString() });
      result.failed++;
      result.details.push(`Failed: ${item.title} — ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return result;
}

export async function fillEvergreenGaps(): Promise<number> {
  const channels = await getChannels();
  let filled = 0;

  for (const channel of channels.filter((c) => c.isActive)) {
    const scheduled = (await getContent({ channelId: channel.id, status: "scheduled" })).length;
    const fill = await evergreenQueueEngine.fillGap(channel.id, scheduled, channel.shortsPerDay);
    if (fill.data) {
      filled++;
    } else if (scheduled < channel.shortsPerDay) {
      const topic = `Evergreen ${channel.contentStyle.replace(/_/g, " ")} content`;
      await createShortFromTopic(topic, channel.id);
      filled++;
    }
  }

  return filled;
}

export async function refreshTrends(): Promise<number> {
  const scan = await trendDiscoveryEngine.scan();
  if (scan.data?.opportunities) {
    await saveTrends(scan.data.opportunities);
    return scan.data.opportunities.length;
  }
  return 0;
}

export async function runFullCron(): Promise<Record<string, unknown>> {
  const publish = await processScheduledPublishing();
  const evergreen = await fillEvergreenGaps();
  const trends = await refreshTrends();

  return {
    publish,
    evergreenFilled: evergreen,
    trendsRefreshed: trends,
    timestamp: new Date().toISOString(),
  };
}

export async function retryFailedJob(jobId: string): Promise<AutomationJob | null> {
  const jobs = await getJobs(100);
  const job = jobs.find((j) => j.id === jobId);
  if (!job || job.status !== "failed") return null;

  const contentId = job.payload.contentId as string;
  const item = await getContentById(contentId);
  if (!item) return null;

  job.status = "running";
  await updateJob(jobId, { status: "running" });

  try {
    const pub = await publishToYouTube(item);
    item.status = "published";
    item.youtubeVideoId = pub.videoId;
    item.publishedAt = new Date().toISOString();
    await saveContent(item);
    await updateJob(jobId, { status: "completed", completedAt: new Date().toISOString() });
  } catch {
    await updateJob(jobId, { status: "failed", completedAt: new Date().toISOString() });
  }

  return job;
}
