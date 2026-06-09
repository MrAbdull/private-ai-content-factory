import { NextResponse } from "next/server";
import { duplicateContent } from "@/lib/store/database";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const copy = await duplicateContent(id);
  if (!copy) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: copy });
}
