import { NextResponse } from "next/server";
import { getChannel, upsertChannel } from "@/lib/store/database";

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
  const updated = await upsertChannel({ ...channel, ...patch, id });
  return NextResponse.json({ success: true, data: updated });
}
