import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import type { ContentItem } from "@/types";
import type { PlatformPublishResult, SocialPlatform } from "@/types/platforms";

function resolveVideoPath(item: ContentItem): string | null {
  if (!item.videoUrl?.startsWith("/api/media/")) return null;
  const filename = item.videoUrl.replace("/api/media/", "");
  return path.join(process.cwd(), config.dataDir, "media", filename);
}

async function publishMetaPlatform(
  item: ContentItem,
  platform: "instagram" | "facebook"
): Promise<PlatformPublishResult> {
  if (!config.hasMeta) {
    const mockId = `${platform}-mock-${item.id.slice(-8)}`;
    return {
      platform,
      success: true,
      externalId: mockId,
      url: platform === "instagram"
        ? `https://www.instagram.com/reel/${mockId}`
        : `https://www.facebook.com/reel/${mockId}`,
      publishedAt: new Date().toISOString(),
    };
  }

  const videoPath = resolveVideoPath(item);
  if (!videoPath) {
    return { platform, success: false, error: "Video file not found" };
  }

  const accessToken = process.env.META_ACCESS_TOKEN!;
  const igUserId = process.env.META_IG_USER_ID;
  const pageId = process.env.META_PAGE_ID;

  const videoData = await fs.readFile(videoPath);
  const targetId = platform === "instagram" ? igUserId : pageId;
  if (!targetId) {
    return { platform, success: false, error: `META_${platform === "instagram" ? "IG_USER" : "PAGE"}_ID not set` };
  }

  const initRes = await fetch(
    `https://graph.facebook.com/v19.0/${targetId}/video_reels?upload_phase=start&access_token=${accessToken}`,
    { method: "POST" }
  );

  if (!initRes.ok) {
    return { platform, success: false, error: `Meta init failed: ${initRes.status}` };
  }

  const init = (await initRes.json()) as { video_id?: string; upload_url?: string };
  if (!init.upload_url || !init.video_id) {
    return { platform, success: false, error: "Meta upload session missing fields" };
  }

  const uploadRes = await fetch(init.upload_url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", Offset: "0", File_Size: String(videoData.length) },
    body: videoData,
  });

  if (!uploadRes.ok) {
    return { platform, success: false, error: `Meta upload failed: ${uploadRes.status}` };
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${targetId}/video_reels?upload_phase=finish&video_id=${init.video_id}&video_state=PUBLISHED&description=${encodeURIComponent(item.description.slice(0, 500))}&access_token=${accessToken}`,
    { method: "POST" }
  );

  if (!publishRes.ok) {
    return { platform, success: false, error: `Meta publish failed: ${publishRes.status}` };
  }

  const published = (await publishRes.json()) as { id?: string };
  return {
    platform,
    success: true,
    externalId: published.id ?? init.video_id,
    url: platform === "instagram" ? `https://www.instagram.com/reel/${published.id}` : `https://facebook.com/reel/${published.id}`,
    publishedAt: new Date().toISOString(),
  };
}

export async function publishInstagram(item: ContentItem): Promise<PlatformPublishResult> {
  return publishMetaPlatform(item, "instagram");
}

export async function publishFacebook(item: ContentItem): Promise<PlatformPublishResult> {
  return publishMetaPlatform(item, "facebook");
}

export function metaPlatformLabel(platform: SocialPlatform): string {
  return platform === "instagram" ? "Instagram Reels" : "Facebook Reels";
}
