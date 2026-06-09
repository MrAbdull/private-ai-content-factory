import { NextResponse } from "next/server";
import { getSources } from "@/lib/store/database";
import { createShortsFromSource } from "@/lib/pipeline/content-pipeline";
import { z } from "zod";

const schema = z.object({
  channelId: z.string(),
  maxCount: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sources = await getSources();
  const source = sources.find((s) => s.id === id);
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  const body = schema.parse(await request.json());
  const items = await createShortsFromSource(source, body.channelId, body.maxCount ?? 5);

  return NextResponse.json({ success: true, data: items, count: items.length });
}
