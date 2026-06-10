import { NextResponse } from "next/server";
import { getChannel, upsertChannel } from "@/lib/store/database";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannel(id);
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await upsertChannel({ ...channel, oauthTokens: undefined, isActive: false });
  return NextResponse.json({ success: true });
}
