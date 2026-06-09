import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard/channels?error=oauth_denied", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/channels?error=no_code", request.url));
  }

  // Exchange code for tokens and store in Supabase per-channel
  // Production: POST to Google token endpoint with client_secret
  return NextResponse.redirect(new URL("/dashboard/channels?connected=true", request.url));
}
