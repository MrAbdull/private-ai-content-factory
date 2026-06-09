import { NextResponse } from "next/server";
import { getContentById, saveContent } from "@/lib/store/database";
import { publishToPlatforms, applyPublishResults } from "@/lib/platforms/orchestrator";
import type { SocialPlatform } from "@/types/platforms";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await getContentById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { platforms?: SocialPlatform[] };
  const results = await publishToPlatforms(item, body.platforms);
  const updated = applyPublishResults(item, results);
  await saveContent(updated);

  return NextResponse.json({ item: updated, results });
}
