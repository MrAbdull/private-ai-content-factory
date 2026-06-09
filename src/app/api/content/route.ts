import { NextResponse } from "next/server";
import { getContent } from "@/lib/store/database";
import type { ContentStatus } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ContentStatus | null;
  const channelId = searchParams.get("channelId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const items = await getContent({
    status: status ?? undefined,
    channelId,
    search,
  });

  return NextResponse.json({ success: true, data: items });
}
