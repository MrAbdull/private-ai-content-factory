import { NextResponse } from "next/server";
import { getContent } from "@/lib/store/database";
import type { ContentStatus } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const items = await getContent({
    status: (searchParams.get("status") as ContentStatus) || undefined,
    channelId: searchParams.get("channelId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    style: searchParams.get("style") ?? undefined,
  });
  return NextResponse.json({ success: true, data: items });
}
