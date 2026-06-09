import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/store/database";

export async function GET() {
  const notifications = await getNotifications();
  return NextResponse.json({ success: true, data: notifications });
}
