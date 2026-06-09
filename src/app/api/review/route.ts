import { NextResponse } from "next/server";
import { getReviewQueue } from "@/lib/store/database";

export async function GET() {
  const items = await getReviewQueue();
  return NextResponse.json({ success: true, data: items });
}
