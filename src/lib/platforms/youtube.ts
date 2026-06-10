import { publishToYouTube } from "@/lib/youtube/publish";
import type { ContentItem } from "@/types";
import type { PlatformPublishResult } from "@/types/platforms";

export async function publishYouTube(item: ContentItem): Promise<PlatformPublishResult> {
  try {
    const result = await publishToYouTube(item);
    return {
      platform: "youtube",
      success: true,
      externalId: result.videoId,
      url: result.url,
      publishedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      platform: "youtube",
      success: false,
      error: e instanceof Error ? e.message : "YouTube publish failed",
    };
  }
}
