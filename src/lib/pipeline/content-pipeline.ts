import { generateScript, generateFromSource } from "@/lib/ai/generator";
import { productionOrchestrator } from "@/lib/engines/production-orchestrator";
import { channelPersonalityEngine } from "@/lib/engines/channel-personality";
import { multiVersionEngine } from "@/lib/engines/multi-version";
import { thumbnailEngine } from "@/lib/engines/thumbnail";
import { safetyComplianceEngine } from "@/lib/engines/safety-compliance";
import { repurposingEngine } from "@/lib/engines/repurposing";
import { videoResourceOrchestrator } from "@/lib/engines/video-resource-orchestrator";
import { searchPexelsVideos } from "@/lib/footage/pexels";
import { searchPixabayVideos } from "@/lib/footage/pixabay";
import { renderShort } from "@/lib/video/renderer";
import { composeThumbnail } from "@/lib/video/thumbnail-compositor";
import path from "path";
import { config } from "@/lib/config";
import {
  saveContent,
  getChannel,
  getFootageUsageIds,
  recordFootageUsage,
  addJob,
  addEvergreenContent,
} from "@/lib/store/database";
import { generateId } from "@/lib/store/local-store";
import type { ContentItem, ContentSource, YouTubeChannel } from "@/types";
import type { AutomationJob } from "@/types";

function nextStatus(channel: YouTubeChannel): ContentItem["status"] {
  if (channel.publishingMode === "manual") return "review";
  if (channel.publishingMode === "semi_automatic") return "review";
  return "scheduled";
}

function nextScheduleSlot(channel: YouTubeChannel): string {
  const slots = channel.publishSlots?.length
    ? channel.publishSlots
    : ["09:00", "12:00", "15:00", "18:00", "21:00"].slice(0, channel.shortsPerDay);
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const d = new Date();
  d.setDate(d.getDate() + (Math.random() > 0.5 ? 0 : 1));
  const [h, m] = slot.split(":");
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d.toISOString();
}

export async function createShortFromTopic(
  topic: string,
  channelId: string,
  sourceId?: string
): Promise<ContentItem> {
  const channel = await getChannel(channelId);
  if (!channel) throw new Error(`Channel not found: ${channelId}`);

  const plan = await productionOrchestrator.plan({
    channel,
    topic,
    availableResources: ["pexels", "pixabay", "openai"],
  });

  const generated = await generateScript(topic, channel, plan.data?.durationSeconds ?? 25);

  const contentId = generateId("cnt");
  let item: ContentItem = {
    id: contentId,
    channelId,
    sourceId,
    title: channelPersonalityEngine.adaptTitle(generated.title, channel),
    description: generated.description,
    hashtags: generated.hashtags,
    script: generated.script,
    hook: generated.hook,
    status: "generating",
    durationSeconds: plan.data?.durationSeconds ?? 25,
    style: channel.contentStyle,
    versions: [],
    thumbnails: [],
    createdAt: new Date().toISOString(),
  };

  const versions = await multiVersionEngine.generateVersions(item);
  if (versions.data) {
    item.versions = versions.data;
    const selected = versions.data.find((v) => v.isSelected);
    if (selected) {
      item.hook = selected.hook;
      item.script = selected.script;
    }
  }

  const thumbs = await thumbnailEngine.generateVariants(contentId, item.title);
  if (thumbs.data) {
    item.thumbnails = thumbs.data;
    const best = thumbs.data.find((t) => t.isSelected);
    if (best) item.thumbnailUrl = best.imageUrl;
  }

  item = await renderAndFinalize(item, channel);
  return item;
}

export async function createShortsFromSource(
  source: ContentSource,
  channelId: string,
  maxCount = 5
): Promise<ContentItem[]> {
  const channel = await getChannel(channelId);
  if (!channel) throw new Error(`Channel not found: ${channelId}`);

  const repurpose = await repurposingEngine.repurpose(source);
  const opportunities = repurpose.data?.opportunities.slice(0, maxCount) ?? [];
  const items: ContentItem[] = [];

  for (const opp of opportunities) {
    const generated = await generateFromSource(source.rawContent, channel, opp.angle);
    const contentId = generateId("cnt");

    let item: ContentItem = {
      id: contentId,
      channelId,
      sourceId: source.id,
      title: channelPersonalityEngine.adaptTitle(generated.title, channel),
      description: generated.description,
      hashtags: generated.hashtags,
      script: generated.script,
      hook: generated.hook,
      status: "generating",
      durationSeconds: 25,
      style: channel.contentStyle,
      versions: [],
      thumbnails: [],
      createdAt: new Date().toISOString(),
    };

    const versions = await multiVersionEngine.generateVersions(item);
    if (versions.data) item.versions = versions.data;

    const thumbs = await thumbnailEngine.generateVariants(contentId, item.title);
    if (thumbs.data) item.thumbnails = thumbs.data;

    item = await renderAndFinalize(item, channel);
    items.push(item);
  }

  return items;
}

async function renderAndFinalize(item: ContentItem, channel: YouTubeChannel): Promise<ContentItem> {
  const usedIds = await getFootageUsageIds();
  const keywords = item.title.split(/\s+/).slice(0, 4);

  let footageUrl: string | undefined;
  const pexels = await searchPexelsVideos(keywords.join(" "), 3);
  const pixabay = await searchPixabayVideos(keywords.join(" "), 3);
  const allClips = [...pexels, ...pixabay].filter((c) => !usedIds.includes(c.id));

  if (allClips.length > 0) {
    footageUrl = allClips[0].url;
    await recordFootageUsage({
      id: generateId("footage"),
      contentId: item.id,
      provider: allClips[0].provider,
      footageId: allClips[0].id,
      footageUrl,
      usedAt: new Date().toISOString(),
    });
  } else {
    const fallback = await videoResourceOrchestrator.selectFootage(item.title, keywords, usedIds);
    footageUrl = fallback.data?.clips[0]?.url;
  }

  try {
    const voice = (channel.personality.voiceSettings?.voice as string) ?? config.ttsVoice;
    const rendered = await renderShort({
      contentId: item.id,
      hook: item.hook,
      script: item.script,
      durationSeconds: item.durationSeconds,
      footageUrl,
      voice,
    });
    item.videoUrl = rendered.videoUrl;

    for (const thumb of item.thumbnails) {
      try {
        const composed = await composeThumbnail({
          contentId: item.id,
          headline: thumb.headline,
          layout: thumb.layout,
        });
        const composedUrl = `/api/media/${path.basename(composed)}`;
        thumb.imageUrl = composedUrl;
        if (thumb.isSelected) item.thumbnailUrl = composedUrl;
      } catch {
        if (thumb.isSelected) item.thumbnailUrl = rendered.thumbnailUrl;
      }
    }
    if (!item.thumbnailUrl) item.thumbnailUrl = rendered.thumbnailUrl;
  } catch (e) {
    console.error("Render failed:", e);
    item.status = "failed";
    await saveContent(item);
    return item;
  }

  const safety = await safetyComplianceEngine.validate(item);
  if (!safety.data?.passed) {
    item.status = "review";
    await saveContent(item);
    return item;
  }

  item.status = nextStatus(channel);
  if (item.status === "scheduled") {
    item.scheduledAt = nextScheduleSlot(channel);
    await enqueuePublishJob(item);
    await addEvergreenContent(item.id, channel.id, 1);
  }

  return saveContent(item);
}

async function enqueuePublishJob(item: ContentItem): Promise<void> {
  const job: AutomationJob = {
    id: generateId("job"),
    type: "schedule_publish",
    provider: "local",
    status: "pending",
    payload: { contentId: item.id, scheduledAt: item.scheduledAt },
    createdAt: new Date().toISOString(),
  };
  await addJob(job);
}

export async function approveContent(id: string, scheduleNow = false): Promise<ContentItem | null> {
  const { getContentById } = await import("@/lib/store/database");
  const item = await getContentById(id);
  if (!item) return null;

  const channel = await getChannel(item.channelId);
  if (!channel) return null;

  item.status = scheduleNow ? "scheduled" : "scheduled";
  item.scheduledAt = scheduleNow ? new Date().toISOString() : nextScheduleSlot(channel);
  await enqueuePublishJob(item);
  return saveContent(item);
}

export async function rejectContent(id: string): Promise<ContentItem | null> {
  const { getContentById } = await import("@/lib/store/database");
  const item = await getContentById(id);
  if (!item) return null;
  item.status = "archived";
  return saveContent(item);
}
