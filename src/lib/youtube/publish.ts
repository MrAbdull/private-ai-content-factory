import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { getChannel } from "@/lib/store/database";
import { getValidAccessToken } from "./oauth";
import type { ContentItem } from "@/types";

export interface PublishResult {
  videoId: string;
  url: string;
}

export async function publishToYouTube(item: ContentItem): Promise<PublishResult> {
  const channel = await getChannel(item.channelId);
  if (!channel) throw new Error("Channel not found");

  const tokens = channel.oauthTokens;

  if (!config.hasYouTube || !tokens) {
    return mockPublish(item);
  }

  const accessToken = await getValidAccessToken(tokens);
  const videoPath = resolveVideoPath(item);

  if (!videoPath) throw new Error("Video file not found");

  const videoId = await resumableUpload(accessToken, videoPath, item);
  return { videoId, url: `https://youtube.com/shorts/${videoId}` };
}

async function mockPublish(item: ContentItem): Promise<PublishResult> {
  const videoId = `local-${item.id.slice(-8)}`;
  return {
    videoId,
    url: `https://youtube.com/shorts/${videoId}`,
  };
}

function resolveVideoPath(item: ContentItem): string | null {
  if (!item.videoUrl?.startsWith("/api/media/")) return null;
  const filename = item.videoUrl.replace("/api/media/", "");
  const full = path.join(process.cwd(), config.dataDir, "media", filename);
  return full;
}

async function resumableUpload(
  accessToken: string,
  videoPath: string,
  item: ContentItem
): Promise<string> {
  const scheduledAt = item.scheduledAt ? new Date(item.scheduledAt) : null;
  const isFutureSchedule = scheduledAt && scheduledAt.getTime() > Date.now() + 60_000;

  const metadata = {
    snippet: {
      title: item.title.slice(0, 100),
      description: `${item.description}\n\n${item.hashtags.join(" ")}`,
      tags: item.hashtags.map((h) => h.replace("#", "")),
      categoryId: "22",
    },
    status: {
      privacyStatus: isFutureSchedule ? "private" : "public",
      selfDeclaredMadeForKids: false,
      ...(isFutureSchedule ? { publishAt: scheduledAt!.toISOString() } : {}),
    },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) throw new Error(`Upload init failed: ${initRes.status}`);
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("No upload URL");

  const videoData = await fs.readFile(videoPath);
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: videoData,
  });

  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
  const result = await uploadRes.json();
  return result.id as string;
}
