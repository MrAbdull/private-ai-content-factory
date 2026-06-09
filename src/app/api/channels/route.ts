import { NextResponse } from "next/server";
import { getChannels, upsertChannel } from "@/lib/store/database";
import { YouTubeClient } from "@/lib/youtube/client";
import { generateId } from "@/lib/store/local-store";
import { channelPersonalityEngine } from "@/lib/engines/channel-personality";
import type { ContentStyle, PublishingMode } from "@/types";

export async function GET() {
  const channels = await getChannels();
  return NextResponse.json({ success: true, data: channels });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === "connect_url") {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/youtube/callback`;
    return NextResponse.json({ authUrl: YouTubeClient.getAuthUrl(redirectUri) });
  }

  if (action === "create_manual") {
    const channel = await upsertChannel({
      id: generateId("ch"),
      name: body.name ?? "New Channel",
      youtubeChannelId: body.youtubeChannelId ?? generateId("yt"),
      shortsPerDay: body.shortsPerDay ?? 3,
      publishingMode: (body.publishingMode ?? "semi_automatic") as PublishingMode,
      contentStyle: (body.contentStyle ?? "educational") as ContentStyle,
      personality: channelPersonalityEngine.buildPersonality(body.contentStyle ?? "educational"),
      isActive: true,
      connectedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, data: channel });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
