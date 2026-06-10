import { NextResponse } from "next/server";
import { getTrends, getChannels } from "@/lib/store/database";
import { createShortFromTopic } from "@/lib/pipeline/content-pipeline";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const count = Math.min(body.count ?? 3, 10);

  const trends = await getTrends();
  const trend = trends.find((t) => t.id === id);
  if (!trend) return NextResponse.json({ error: "Trend not found" }, { status: 404 });

  const channels = await getChannels();
  const channelIds: string[] = body.channelIds ?? channels.filter((c) => c.isActive).map((c) => c.id);
  if (!channelIds.length) return NextResponse.json({ error: "No channels" }, { status: 400 });

  const topics = [trend.topic, ...trend.suggestedAngles].slice(0, count);
  const contentIds: string[] = [];

  for (let i = 0; i < topics.length; i++) {
    const ch = channelIds[i % channelIds.length];
    const item = await createShortFromTopic(topics[i], ch);
    contentIds.push(item.id);
  }

  return NextResponse.json({ success: true, data: { trendId: id, contentIds, generated: contentIds.length } });
}
