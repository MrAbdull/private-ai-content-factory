import {
  getContent, getContentById, getChannels, saveContent, getJobs, updateJob, addJob,
  saveMetrics,
} from "@/lib/store/database";
import { publishToYouTube } from "@/lib/youtube/publish";
import { syncChannelAnalytics } from "@/lib/youtube/analytics";
import { createShortFromTopic } from "@/lib/pipeline/content-pipeline";
import { failedVideoLearningEngine } from "@/lib/engines/failed-video-learning";
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
      id: jobId, type: "publish", provider: "local", status: "running",
      payload: { contentId: item.id }, createdAt: new Date().toISOString(),
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

export async function syncAnalytics(): Promise<number> {
  const channels = await getChannels();
  let synced = 0;

  for (const channel of channels) {
    const published = await getContent({ channelId: channel.id, status: "published" });
    const metrics = await syncChannelAnalytics(channel, published);
    for (const m of metrics) {
      await saveMetrics(m);
      synced++;

      const item = await getContentById(m.contentId);
      if (item && m.retentionRate < 0.35) {
        const analysis = await failedVideoLearningEngine.analyze(item, m);
        if (analysis.data?.improvedTitle) {
          await addJob({
            id: generateId("job"),
            type: "regenerate_improved",
            provider: "local",
            status: "pending",
            payload: {
              contentId: item.id,
              improvedTitle: analysis.data.improvedTitle,
              improvements: analysis.data.improvements,
            },
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return synced;
}

export async function processPendingJobs(): Promise<number> {
  const jobs = (await getJobs(100)).filter((j) => j.status === "pending");
  let done = 0;

  for (const job of jobs) {
    if (job.type === "regenerate_improved") {
      const contentId = job.payload.contentId as string;
      const item = await getContentById(contentId);
      if (item) {
        await createShortFromTopic(
          (job.payload.improvedTitle as string) || `${item.title} (Improved)`,
          item.channelId,
          item.sourceId
        );
        await updateJob(job.id, { status: "completed", completedAt: new Date().toISOString() });
        done++;
      }
    }
  }

  return done;
}

export async function fillEvergreenGaps(): Promise<number> {
  const channels = await getChannels();
  let filled = 0;

  for (const channel of channels.filter((c) => c.isActive)) {
    const scheduled = (await getContent({ channelId: channel.id, status: "scheduled" })).length;
    if (scheduled < channel.shortsPerDay) {
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
  const analytics = await syncAnalytics();
  const jobs = await processPendingJobs();
  const evergreen = await fillEvergreenGaps();
  const trends = await refreshTrends();

  return { publish, analyticsSynced: analytics, jobsProcessed: jobs, evergreenFilled: evergreen, trendsRefreshed: trends, timestamp: new Date().toISOString() };
}

export async function retryFailedJob(jobId: string): Promise<AutomationJob | null> {
  const jobs = await getJobs(100);
  const job = jobs.find((j) => j.id === jobId);
  if (!job || job.status !== "failed") return null;

  const contentId = job.payload.contentId as string;
  const item = await getContentById(contentId);
  if (!item) return null;

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
