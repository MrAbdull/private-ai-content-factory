import { NextResponse } from "next/server";
import { resourceManagementEngine } from "@/lib/engines/resource-management";
import { getJobs, getContent } from "@/lib/store/database";
import { config } from "@/lib/config";

export async function GET() {
  const jobs = await getJobs(50);
  const activeJobs = jobs.filter((j) => j.status === "pending" || j.status === "running").length;
  const failedJobs24h = jobs.filter((j) => {
    if (j.status !== "failed") return false;
    const t = new Date(j.createdAt).getTime();
    return Date.now() - t < 86400000;
  }).length;

  const queueDepth = (await getContent({ status: "generating" })).length +
    (await getContent({ status: "scheduled" })).length;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      openai: config.hasOpenAI,
      youtube: config.hasYouTube,
      pexels: config.hasPexels,
      pixabay: config.hasPixabay,
      supabase: config.hasSupabase,
    },
    resources: resourceManagementEngine.getUsageSnapshot(),
    activeJobs,
    queueDepth,
    failedJobs24h,
  });
}
