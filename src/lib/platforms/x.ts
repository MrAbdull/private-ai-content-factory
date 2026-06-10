import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import type { ContentItem } from "@/types";
import type { PlatformPublishResult } from "@/types/platforms";

function resolveVideoPath(item: ContentItem): string | null {
  if (!item.videoUrl?.startsWith("/api/media/")) return null;
  const filename = item.videoUrl.replace("/api/media/", "");
  return path.join(process.cwd(), config.dataDir, "media", filename);
}

export async function publishX(item: ContentItem): Promise<PlatformPublishResult> {
  if (!config.hasX) {
    const mockId = `x-mock-${item.id.slice(-8)}`;
    return {
      platform: "x",
      success: true,
      externalId: mockId,
      url: `https://x.com/i/status/${mockId}`,
      publishedAt: new Date().toISOString(),
    };
  }

  const videoPath = resolveVideoPath(item);
  if (!videoPath) {
    return { platform: "x", success: false, error: "Video file not found" };
  }

  const bearer = process.env.X_API_BEARER_TOKEN!;
  const videoData = await fs.readFile(videoPath);

  const initRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      command: "INIT",
      total_bytes: String(videoData.length),
      media_type: "video/mp4",
      media_category: "tweet_video",
    }),
  });

  if (!initRes.ok) {
    return { platform: "x", success: false, error: `X media init failed: ${initRes.status}` };
  }

  const init = (await initRes.json()) as { media_id_string?: string };
  if (!init.media_id_string) {
    return { platform: "x", success: false, error: "X media_id missing" };
  }

  const appendRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}` },
    body: (() => {
      const form = new FormData();
      form.append("command", "APPEND");
      form.append("media_id", init.media_id_string!);
      form.append("segment_index", "0");
      form.append("media", new Blob([new Uint8Array(videoData)], { type: "video/mp4" }));
      return form;
    })(),
  });

  if (!appendRes.ok) {
    return { platform: "x", success: false, error: `X media append failed: ${appendRes.status}` };
  }

  const finalizeRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      command: "FINALIZE",
      media_id: init.media_id_string,
    }),
  });

  if (!finalizeRes.ok) {
    return { platform: "x", success: false, error: `X media finalize failed: ${finalizeRes.status}` };
  }

  const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: `${item.title.slice(0, 200)} ${item.hashtags.slice(0, 3).join(" ")}`.trim(),
      media: { media_ids: [init.media_id_string] },
    }),
  });

  if (!tweetRes.ok) {
    const err = await tweetRes.text();
    return { platform: "x", success: false, error: `X tweet failed: ${err.slice(0, 200)}` };
  }

  const tweet = (await tweetRes.json()) as { data?: { id?: string } };
  const tweetId = tweet.data?.id;
  return {
    platform: "x",
    success: true,
    externalId: tweetId,
    url: tweetId ? `https://x.com/i/status/${tweetId}` : undefined,
    publishedAt: new Date().toISOString(),
  };
}
