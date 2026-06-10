import { config } from "@/lib/config";
import { getCrossPostDefaults } from "@/lib/store/local-database";
import type { ContentItem } from "@/types";
import type { PlatformConnection, PlatformPublishResult, SocialPlatform } from "@/types/platforms";
import { publishYouTube } from "./youtube";
import { publishTikTok } from "./tiktok";
import { publishInstagram, publishFacebook } from "./meta";
import { publishLinkedIn } from "./linkedin";
import { publishX } from "./x";

const PUBLISHERS: Record<SocialPlatform, (item: ContentItem) => Promise<PlatformPublishResult>> = {
  youtube: publishYouTube,
  tiktok: publishTikTok,
  instagram: publishInstagram,
  facebook: publishFacebook,
  linkedin: publishLinkedIn,
  x: publishX,
};

export function getPlatformConnections(): PlatformConnection[] {
  return [
    { platform: "youtube", connected: config.hasYouTube, configured: config.hasYouTube, accountName: config.hasYouTube ? "OAuth configured" : undefined },
    { platform: "tiktok", connected: config.hasTikTok, configured: config.hasTikTok },
    { platform: "instagram", connected: config.hasMeta, configured: config.hasMeta },
    { platform: "facebook", connected: config.hasMeta, configured: config.hasMeta },
    { platform: "linkedin", connected: config.hasLinkedIn, configured: config.hasLinkedIn },
    { platform: "x", connected: config.hasX, configured: config.hasX },
  ];
}

export async function resolveCrossPostPlatforms(item: ContentItem): Promise<SocialPlatform[]> {
  const fromItem = (item.crossPostPlatforms ?? []) as SocialPlatform[];
  const fromStore = (await getCrossPostDefaults()) as SocialPlatform[];
  const defaults = config.defaultCrossPost as SocialPlatform[];
  const merged = [...new Set([...fromItem, ...fromStore, ...defaults])];
  return merged.filter((p) => p in PUBLISHERS);
}

export async function publishToPlatforms(
  item: ContentItem,
  platforms?: SocialPlatform[]
): Promise<PlatformPublishResult[]> {
  const targets = platforms ?? (await resolveCrossPostPlatforms(item));
  const results: PlatformPublishResult[] = [];

  for (const platform of targets) {
    const publisher = PUBLISHERS[platform];
    if (!publisher) continue;
    const result = await publisher(item);
    results.push(result);
  }

  return results;
}

export function applyPublishResults(
  item: ContentItem,
  results: PlatformPublishResult[]
): ContentItem {
  const platformIds = { ...(item.platformIds ?? {}) };
  for (const r of results) {
    if (r.success && r.externalId) {
      platformIds[r.platform] = r.externalId;
    }
  }
  const anySuccess = results.some((r) => r.success);
  const youtubeOk = results.find((r) => r.platform === "youtube")?.success ?? !results.some((r) => r.platform === "youtube");

  return {
    ...item,
    platformIds,
    youtubeVideoId: platformIds.youtube ?? item.youtubeVideoId,
    status: anySuccess && youtubeOk ? "published" : item.status === "scheduled" ? "failed" : item.status,
    publishedAt: anySuccess ? new Date().toISOString() : item.publishedAt,
  };
}
