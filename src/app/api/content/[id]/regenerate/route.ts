import { NextResponse } from "next/server";
import { getContentById } from "@/lib/store/database";
import { createShortFromTopic } from "@/lib/pipeline/content-pipeline";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await getContentById(id);
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await createShortFromTopic(original.title, original.channelId, original.sourceId);
  return NextResponse.json({ success: true, data: item });
}
