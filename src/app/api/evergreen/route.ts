import { NextResponse } from "next/server";
import { getEvergreenQueue, removeEvergreen, addEvergreenContent, getContentById } from "@/lib/store/database";

export async function GET() {
  const queue = await getEvergreenQueue();
  return NextResponse.json({ success: true, data: queue });
}

export async function POST(request: Request) {
  const { contentId, channelId, priority } = await request.json();
  const content = await getContentById(contentId);
  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });
  await addEvergreenContent(contentId, channelId ?? content.channelId, priority ?? 0);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");
  if (!contentId) return NextResponse.json({ error: "contentId required" }, { status: 400 });
  await removeEvergreen(contentId);
  return NextResponse.json({ success: true });
}
