import { NextResponse } from "next/server";
import { resourceManagementEngine } from "@/lib/engines/resource-management";
import { automationOrchestrator } from "@/lib/engines/automation-orchestrator";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    resources: resourceManagementEngine.getUsageSnapshot(),
    activeJobs: automationOrchestrator.getActiveJobs().length,
  });
}
