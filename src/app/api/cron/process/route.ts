import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { runFullCron } from "@/lib/jobs/processor";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = request.headers.get("x-cron-secret");

  if (authHeader !== `Bearer ${config.cronSecret}` && secret !== config.cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFullCron();
  return NextResponse.json({ success: true, data: result });
}

export async function GET(request: Request) {
  return POST(request);
}
