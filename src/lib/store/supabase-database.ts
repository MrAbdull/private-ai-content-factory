import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AutomationJob,
  ContentItem,
  ContentSource,
  ContentStatus,
  PerformanceMetrics,
  ThumbnailVariant,
  TrendOpportunity,
  VideoVersion,
  YouTubeChannel,
} from "@/types";
import * as local from "./local-database";

const uid = () => config.singleUserId;
function db() {
  return createAdminClient();
}

function rowToChannel(r: Record<string, unknown>): YouTubeChannel {
  const personality = (r.personality as YouTubeChannel["personality"]) ?? {};
  return {
    id: r.id as string,
    name: r.name as string,
    youtubeChannelId: r.youtube_channel_id as string,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    subscriberCount: Number(r.subscriber_count ?? 0),
    shortsPerDay: Number(r.shorts_per_day ?? 3),
    publishingMode: r.publishing_mode as YouTubeChannel["publishingMode"],
    contentStyle: r.content_style as YouTubeChannel["contentStyle"],
    personality,
    publishSlots: (personality as { publishSlots?: string[] }).publishSlots,
    isActive: Boolean(r.is_active),
    connectedAt: r.connected_at as string,
    oauthTokens: r.oauth_tokens as YouTubeChannel["oauthTokens"],
  };
}

async function loadVersionsAndThumbs(contentIds: string[]) {
  if (!contentIds.length) return { versions: {} as Record<string, VideoVersion[]>, thumbnails: {} as Record<string, ThumbnailVariant[]> };
  const supabase = db();
  const [vRes, tRes] = await Promise.all([
    supabase.from("video_versions").select("*").in("content_id", contentIds),
    supabase.from("thumbnail_variants").select("*").in("content_id", contentIds),
  ]);
  const versions: Record<string, VideoVersion[]> = {};
  const thumbnails: Record<string, ThumbnailVariant[]> = {};
  for (const v of vRes.data ?? []) {
    const cid = v.content_id as string;
    (versions[cid] ??= []).push({
      id: v.id as string,
      contentId: cid,
      versionNumber: v.version_number as number,
      hook: (v.hook as string) ?? "",
      script: (v.script as string) ?? "",
      narrationStyle: (v.narration_style as string) ?? "",
      pacingStrategy: (v.pacing_strategy as string) ?? "",
      editingStyle: (v.editing_style as string) ?? "",
      captionStyle: (v.caption_style as string) ?? "",
      predictedScore: Number(v.predicted_score ?? 0),
      isSelected: Boolean(v.is_selected),
      videoUrl: v.video_url as string | undefined,
    });
  }
  for (const t of tRes.data ?? []) {
    const cid = t.content_id as string;
    (thumbnails[cid] ??= []).push({
      id: t.id as string,
      contentId: cid,
      headline: (t.headline as string) ?? "",
      layout: (t.layout as string) ?? "",
      imageUrl: t.image_url as string | undefined,
      predictedCtr: Number(t.predicted_ctr ?? 0),
      isSelected: Boolean(t.is_selected),
    });
  }
  return { versions, thumbnails };
}

function rowToContent(r: Record<string, unknown>, versions: VideoVersion[], thumbnails: ThumbnailVariant[]): ContentItem {
  return {
    id: r.id as string,
    channelId: (r.channel_id as string) ?? "",
    sourceId: r.source_id as string | undefined,
    title: r.title as string,
    description: (r.description as string) ?? "",
    hashtags: (r.hashtags as string[]) ?? [],
    script: (r.script as string) ?? "",
    hook: (r.hook as string) ?? "",
    status: r.status as ContentItem["status"],
    durationSeconds: Number(r.duration_seconds ?? 30),
    style: r.content_style as ContentItem["style"],
    videoUrl: r.video_url as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    scheduledAt: r.scheduled_at as string | undefined,
    publishedAt: r.published_at as string | undefined,
    youtubeVideoId: r.youtube_video_id as string | undefined,
    versions,
    thumbnails,
    createdAt: r.created_at as string,
  };
}

export async function getChannels(): Promise<YouTubeChannel[]> {
  const { data, error } = await db().from("youtube_channels").select("*").eq("user_id", uid());
  if (error) throw error;
  return (data ?? []).map(rowToChannel);
}

export async function getChannel(id: string) {
  const { data } = await db().from("youtube_channels").select("*").eq("id", id).maybeSingle();
  return data ? rowToChannel(data) : undefined;
}

export async function upsertChannel(channel: YouTubeChannel) {
  const personality = { ...channel.personality, publishSlots: channel.publishSlots };
  const { error } = await db().from("youtube_channels").upsert({
    id: channel.id,
    user_id: uid(),
    name: channel.name,
    youtube_channel_id: channel.youtubeChannelId,
    thumbnail_url: channel.thumbnailUrl,
    subscriber_count: channel.subscriberCount ?? 0,
    shorts_per_day: channel.shortsPerDay,
    publishing_mode: channel.publishingMode,
    content_style: channel.contentStyle,
    personality,
    oauth_tokens: channel.oauthTokens,
    is_active: channel.isActive,
    connected_at: channel.connectedAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return channel;
}

export async function getContent(filters?: { status?: ContentStatus; channelId?: string; search?: string; style?: string }) {
  let q = db().from("content_items").select("*").eq("user_id", uid()).order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.channelId) q = q.eq("channel_id", filters.channelId);
  const { data } = await q;
  let rows = data ?? [];
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter((r) => String(r.title).toLowerCase().includes(s));
  }
  if (filters?.style) rows = rows.filter((r) => r.content_style === filters.style);
  const ids = rows.map((r) => r.id as string);
  const { versions, thumbnails } = await loadVersionsAndThumbs(ids);
  return rows.map((r) => rowToContent(r, versions[r.id as string] ?? [], thumbnails[r.id as string] ?? []));
}

export async function getContentById(id: string) {
  const { data } = await db().from("content_items").select("*").eq("id", id).maybeSingle();
  if (!data) return undefined;
  const { versions, thumbnails } = await loadVersionsAndThumbs([id]);
  return rowToContent(data, versions[id] ?? [], thumbnails[id] ?? []);
}

export async function saveContent(item: ContentItem) {
  await db().from("content_items").upsert({
    id: item.id,
    user_id: uid(),
    channel_id: item.channelId,
    source_id: item.sourceId,
    title: item.title,
    description: item.description,
    hashtags: item.hashtags,
    script: item.script,
    hook: item.hook,
    status: item.status,
    duration_seconds: item.durationSeconds,
    content_style: item.style,
    video_url: item.videoUrl,
    thumbnail_url: item.thumbnailUrl,
    scheduled_at: item.scheduledAt,
    published_at: item.publishedAt,
    youtube_video_id: item.youtubeVideoId,
    updated_at: new Date().toISOString(),
    created_at: item.createdAt,
  });
  if (item.versions.length) {
    await db().from("video_versions").upsert(item.versions.map((v) => ({
      id: v.id, content_id: item.id, version_number: v.versionNumber, hook: v.hook, script: v.script,
      narration_style: v.narrationStyle, pacing_strategy: v.pacingStrategy, editing_style: v.editingStyle,
      caption_style: v.captionStyle, predicted_score: v.predictedScore, is_selected: v.isSelected, video_url: v.videoUrl,
    })));
  }
  if (item.thumbnails.length) {
    await db().from("thumbnail_variants").upsert(item.thumbnails.map((t) => ({
      id: t.id, content_id: item.id, headline: t.headline, layout: t.layout,
      image_url: t.imageUrl, predicted_ctr: t.predictedCtr, is_selected: t.isSelected,
    })));
  }
  return item;
}

export const deleteContent = local.deleteContent;
export const duplicateContent = local.duplicateContent;

export async function getSources() {
  const { data } = await db().from("content_sources").select("*").eq("user_id", uid()).order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id as string,
    type: r.type as ContentSource["type"],
    title: r.title as string,
    rawContent: (r.raw_content as string) ?? "",
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  }));
}

export async function saveSource(source: ContentSource) {
  await db().from("content_sources").upsert({
    id: source.id, user_id: uid(), type: source.type, title: source.title,
    raw_content: source.rawContent, metadata: source.metadata, created_at: source.createdAt,
  });
  return source;
}

export async function getMetrics() {
  const { data } = await db().from("performance_metrics").select("*").order("recorded_at", { ascending: false });
  return (data ?? []).map((r) => ({
    contentId: r.content_id as string,
    views: Number(r.views ?? 0),
    watchTimeSeconds: Number(r.watch_time_seconds ?? 0),
    retentionRate: Number(r.retention_rate ?? 0),
    clickThroughRate: Number(r.click_through_rate ?? 0),
    subscribersGained: Number(r.subscribers_gained ?? 0),
    likes: Number(r.likes ?? 0),
    comments: Number(r.comments ?? 0),
    shares: Number(r.shares ?? 0),
    recordedAt: r.recorded_at as string,
  }));
}

export async function saveMetrics(metrics: PerformanceMetrics) {
  await db().from("performance_metrics").insert({
    content_id: metrics.contentId, views: metrics.views, watch_time_seconds: metrics.watchTimeSeconds,
    retention_rate: metrics.retentionRate, click_through_rate: metrics.clickThroughRate,
    subscribers_gained: metrics.subscribersGained, likes: metrics.likes, comments: metrics.comments,
    shares: metrics.shares, recorded_at: metrics.recordedAt,
  });
}

export async function getTrends() {
  const { data } = await db().from("trend_opportunities").select("*").eq("user_id", uid());
  return (data ?? []).map((r) => ({
    id: r.id as string, topic: r.topic as string, source: r.source as string,
    score: Number(r.score ?? 0), suggestedAngles: (r.suggested_angles as string[]) ?? [],
    detectedAt: r.detected_at as string,
  }));
}

export async function saveTrends(trends: TrendOpportunity[]) {
  await db().from("trend_opportunities").delete().eq("user_id", uid());
  if (trends.length) {
    await db().from("trend_opportunities").insert(trends.map((t) => ({
      id: t.id, user_id: uid(), topic: t.topic, source: t.source, score: t.score,
      suggested_angles: t.suggestedAngles, detected_at: t.detectedAt,
    })));
  }
}

export async function getJobs(limit = 50) {
  const { data } = await db().from("automation_jobs").select("*").eq("user_id", uid()).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id as string, type: r.job_type as string, provider: r.provider as AutomationJob["provider"],
    status: r.status as AutomationJob["status"], payload: (r.payload as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string, completedAt: r.completed_at as string | undefined,
  }));
}

export async function addJob(job: AutomationJob) {
  await db().from("automation_jobs").insert({
    id: job.id, user_id: uid(), job_type: job.type, provider: job.provider,
    status: job.status, payload: job.payload, created_at: job.createdAt, completed_at: job.completedAt,
  });
  return job;
}

export async function updateJob(id: string, patch: Partial<AutomationJob>) {
  await db().from("automation_jobs").update({
    status: patch.status, completed_at: patch.completedAt, payload: patch.payload,
  }).eq("id", id);
}

export const getPendingJobs = local.getPendingJobs;
export const saveBlastOperation = local.saveBlastOperation;
export const recordFootageUsage = local.recordFootageUsage;
export const getFootageUsageIds = local.getFootageUsageIds;
export const getReviewQueue = local.getReviewQueue;
export const getScheduledContent = local.getScheduledContent;
export const addEvergreenContent = local.addEvergreenContent;
export const deleteChannel = local.deleteChannel;
export const getEvergreenQueue = local.getEvergreenQueue;
export const removeEvergreen = local.removeEvergreen;
export const getNotifications = local.getNotifications;
