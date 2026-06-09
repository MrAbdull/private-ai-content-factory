/**
 * YouTube Data API client for channel management and publishing.
 * Requires OAuth tokens stored per-channel in Supabase.
 */

export interface YouTubeOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface YouTubeUploadParams {
  title: string;
  description: string;
  tags: string[];
  videoFileUrl: string;
  scheduledPublishTime?: string;
  categoryId?: string;
}

export class YouTubeClient {
  constructor(private tokens: YouTubeOAuthTokens) {}

  static getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async listChannels(): Promise<{ id: string; title: string; thumbnailUrl?: string; subscriberCount?: number }[]> {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${this.tokens.accessToken}` } }
    );
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const data = await res.json();
    return (data.items ?? []).map((item: { id: string; snippet: { title: string; thumbnails?: { default?: { url: string } } }; statistics?: { subscriberCount: string } }) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(item.statistics?.subscriberCount ?? "0", 10),
    }));
  }

  async uploadShort(params: YouTubeUploadParams): Promise<{ videoId: string }> {
    void params;
    // Production: resumable upload via YouTube Data API v3
    // Placeholder returns mock ID when API not configured
    if (!process.env.YOUTUBE_CLIENT_ID) {
      return { videoId: `mock-${Date.now()}` };
    }
    throw new Error("YouTube upload requires full OAuth flow and video binary upload");
  }
}
