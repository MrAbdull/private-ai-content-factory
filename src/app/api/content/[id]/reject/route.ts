import { NextResponse } from "next/server";
import { rejectContent } from "@/lib/pipeline/content-pipeline";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await rejectContent(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: item });
}
