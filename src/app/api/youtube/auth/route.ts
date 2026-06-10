import { NextResponse } from "next/server";
import { YouTubeClient } from "@/lib/youtube/client";

export async function GET() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/youtube/callback`;
  const authUrl = YouTubeClient.getAuthUrl(redirectUri);
  return NextResponse.json({ authUrl });
}
