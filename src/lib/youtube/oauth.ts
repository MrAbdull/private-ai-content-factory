export interface YouTubeTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  obtained_at: number;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<YouTubeTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  return { ...data, obtained_at: Date.now() };
}

export async function refreshAccessToken(refreshToken: string): Promise<YouTubeTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Token refresh failed");
  const data = await res.json();
  return { ...data, refresh_token: refreshToken, obtained_at: Date.now() };
}

export function isTokenExpired(tokens: YouTubeTokens): boolean {
  const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;
  return Date.now() > expiresAt - 60_000;
}

export async function getValidAccessToken(tokens: YouTubeTokens): Promise<string> {
  if (!isTokenExpired(tokens)) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error("Token expired and no refresh token");
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  return refreshed.access_token;
}
