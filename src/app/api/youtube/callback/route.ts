import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/youtube/oauth";
import { YouTubeClient } from "@/lib/youtube/client";
import { upsertChannel, getChannels } from "@/lib/store/database";
import { generateId } from "@/lib/store/local-store";
import { channelPersonalityEngine } from "@/lib/engines/channel-personality";
import { config } from "@/lib/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const base = config.appUrl;

  if (error) {
    return NextResponse.redirect(`${base}/dashboard/channels?error=oauth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${base}/dashboard/channels?error=no_code`);
  }

  const redirectUri = `${base}/api/youtube/callback`;

  try {
    if (config.hasYouTube) {
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      const client = new YouTubeClient({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiresAt: tokens.obtained_at + tokens.expires_in * 1000,
      });
      const ytChannels = await client.listChannels();

      for (const yt of ytChannels) {
        const existing = (await getChannels()).find((c) => c.youtubeChannelId === yt.id);
        await upsertChannel({
          id: existing?.id ?? generateId("ch"),
          name: yt.title,
          youtubeChannelId: yt.id,
          thumbnailUrl: yt.thumbnailUrl,
          subscriberCount: yt.subscriberCount,
          shortsPerDay: existing?.shortsPerDay ?? 3,
          publishingMode: existing?.publishingMode ?? "semi_automatic",
          contentStyle: existing?.contentStyle ?? "educational",
          personality: existing?.personality ?? channelPersonalityEngine.buildPersonality("educational"),
          isActive: true,
          connectedAt: existing?.connectedAt ?? new Date().toISOString(),
          oauthTokens: tokens,
        });
      }
    }

    return NextResponse.redirect(`${base}/dashboard/channels?connected=true`);
  } catch (e) {
    console.error("OAuth callback error:", e);
    return NextResponse.redirect(`${base}/dashboard/channels?error=oauth_failed`);
  }
}
