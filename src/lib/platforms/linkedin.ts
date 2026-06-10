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

export async function publishLinkedIn(item: ContentItem): Promise<PlatformPublishResult> {
  if (!config.hasLinkedIn) {
    const mockId = `li-mock-${item.id.slice(-8)}`;
    return {
      platform: "linkedin",
      success: true,
      externalId: mockId,
      url: `https://www.linkedin.com/feed/update/${mockId}`,
      publishedAt: new Date().toISOString(),
    };
  }

  const videoPath = resolveVideoPath(item);
  if (!videoPath) {
    return { platform: "linkedin", success: false, error: "Video file not found" };
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN!;
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN ?? "urn:li:person:me";
  const videoData = await fs.readFile(videoPath);

  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
        owner: authorUrn,
        serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
      },
    }),
  });

  if (!registerRes.ok) {
    return { platform: "linkedin", success: false, error: `LinkedIn register failed: ${registerRes.status}` };
  }

  const reg = (await registerRes.json()) as {
    value?: { uploadMechanism?: Record<string, { uploadUrl?: string }>; asset?: string };
  };
  const uploadUrl = reg.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const asset = reg.value?.asset;
  if (!uploadUrl || !asset) {
    return { platform: "linkedin", success: false, error: "LinkedIn upload URL missing" };
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/octet-stream" },
    body: videoData,
  });

  if (!uploadRes.ok) {
    return { platform: "linkedin", success: false, error: `LinkedIn upload failed: ${uploadRes.status}` };
  }

  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: `${item.title}\n\n${item.description.slice(0, 500)}` },
          shareMediaCategory: "VIDEO",
          media: [{ status: "READY", media: asset, title: { text: item.title.slice(0, 100) } }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!postRes.ok) {
    return { platform: "linkedin", success: false, error: `LinkedIn post failed: ${postRes.status}` };
  }

  const post = (await postRes.json()) as { id?: string };
  return {
    platform: "linkedin",
    success: true,
    externalId: post.id,
    url: post.id ? `https://www.linkedin.com/feed/update/${post.id}` : undefined,
    publishedAt: new Date().toISOString(),
  };
}
