import { NextResponse } from "next/server";
import { getChannel, upsertChannel } from "@/lib/store/database";
import { channelPersonalityEngine } from "@/lib/engines/channel-personality";
import type { ContentStyle, PublishingMode } from "@/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannel(id);
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: channel });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannel(id);
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch = await request.json();
  const contentStyle = (patch.contentStyle ?? channel.contentStyle) as ContentStyle;

  const updated = await upsertChannel({
    ...channel,
    name: patch.name ?? channel.name,
    shortsPerDay: patch.shortsPerDay ?? channel.shortsPerDay,
    publishingMode: (patch.publishingMode ?? channel.publishingMode) as PublishingMode,
    contentStyle,
    publishSlots: patch.publishSlots ?? channel.publishSlots,
    personality: patch.personality ?? channel.personality ?? channelPersonalityEngine.buildPersonality(contentStyle),
    isActive: patch.isActive ?? channel.isActive,
  });

  return NextResponse.json({ success: true, data: updated });
}
