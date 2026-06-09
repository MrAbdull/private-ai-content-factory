import { NextResponse } from "next/server";
import { getPlatformConnections } from "@/lib/platforms/orchestrator";
import { getCrossPostDefaults, setCrossPostDefaults } from "@/lib/store/local-database";
import { config } from "@/lib/config";
import type { SocialPlatform } from "@/types/platforms";

const VALID_PLATFORMS: SocialPlatform[] = ["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"];

export async function GET() {
  const connections = getPlatformConnections();
  const crossPostDefaults = await getCrossPostDefaults();
  return NextResponse.json({
    connections,
    crossPostDefaults,
    envDefaults: config.defaultCrossPost,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { crossPostDefaults?: string[] };
  if (!body.crossPostDefaults) {
    return NextResponse.json({ error: "crossPostDefaults required" }, { status: 400 });
  }
  const valid = body.crossPostDefaults.filter((p): p is SocialPlatform =>
    VALID_PLATFORMS.includes(p as SocialPlatform)
  );
  const saved = await setCrossPostDefaults(valid);
  return NextResponse.json({ crossPostDefaults: saved });
}
