import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import type { ContentItem } from "@/types";
import type { PlatformPublishResult } from "@/types/platforms";

function resolveVideoPath(item: ContentItem): string | null {
  if (!item.videoUrl) return null;
  if (item.videoUrl.startsWith("/api/media/")) {
    const filename = item.videoUrl.replace("/api/media/", "");
    return path.join(process.cwd(), config.dataDir, "media", filename);
  }
  if (item.videoUrl.startsWith("http")) return null;
  return null;
}

export async function publishTikTok(item: ContentItem): Promise<PlatformPublishResult> {
  if (!config.hasTikTok) {
    return {
      platform: "tiktok",
      success: true,
      externalId: `tiktok-mock-${item.id.slice(-8)}`,
      url: `https://www.tiktok.com/@studio/video/mock-${item.id.slice(-8)}`,
      publishedAt: new Date().toISOString(),
    };
  }

  const videoPath = resolveVideoPath(item);
  if (!videoPath) {
    return { platform: "tiktok", success: false, error: "Video file not found for TikTok upload" };
  }

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN!;
  const videoData = await fs.readFile(videoPath);

  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: item.title.slice(0, 150),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: { source: "FILE_UPLOAD", video_size: videoData.length, chunk_size: videoData.length },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    return { platform: "tiktok", success: false, error: `TikTok init failed: ${err.slice(0, 200)}` };
  }

  const init = (await initRes.json()) as { data?: { publish_id?: string; upload_url?: string } };
  const uploadUrl = init.data?.upload_url;
  if (!uploadUrl) {
    return { platform: "tiktok", success: false, error: "No TikTok upload URL returned" };
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(videoData.length) },
    body: videoData,
  });

  if (!uploadRes.ok) {
    return { platform: "tiktok", success: false, error: `TikTok upload failed: ${uploadRes.status}` };
  }

  return {
    platform: "tiktok",
    success: true,
    externalId: init.data?.publish_id,
    url: `https://www.tiktok.com/@studio`,
    publishedAt: new Date().toISOString(),
  };
}
