import { NextResponse } from "next/server";
import { approveContent } from "@/lib/pipeline/content-pipeline";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const item = await approveContent(id, body.scheduleNow === true);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: item });
}
