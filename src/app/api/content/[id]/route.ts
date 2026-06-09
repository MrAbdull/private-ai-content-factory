import { NextResponse } from "next/server";
import { getContentById, saveContent, deleteContent } from "@/lib/store/database";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getContentById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: item });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getContentById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch = await request.json();
  const updated = await saveContent({ ...item, ...patch, id });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteContent(id);
  return NextResponse.json({ success: true });
}
