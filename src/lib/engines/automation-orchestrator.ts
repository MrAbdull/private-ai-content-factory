import { resourceManagementEngine } from "./resource-management";
import { productionOrchestrator } from "./production-orchestrator";
import { safetyComplianceEngine } from "./safety-compliance";
import { evergreenQueueEngine } from "./evergreen-queue";
import type { AutomationJob, ContentItem, YouTubeChannel } from "@/types";
import type { EngineResult } from "./types";

/**
 * Automation Orchestrator — coordinates end-to-end autonomous publishing.
 */
export class AutomationOrchestrator {
  private jobs: AutomationJob[] = [];

  async runPublishingPipeline(
    content: ContentItem,
    channel: YouTubeChannel
  ): Promise<EngineResult<AutomationJob[]>> {
    const pipelineJobs: AutomationJob[] = [];

    const steps = [
      { type: "generate_video", task: "video_render" },
      { type: "safety_check", task: "db_operation" },
      { type: "upload_storage", task: "storage_upload" },
      { type: "schedule_publish", task: "scheduled_publish" },
    ];

    for (const step of steps) {
      const route = resourceManagementEngine.routeTask(step.task);
      const job: AutomationJob = {
        id: `job-${Date.now()}-${step.type}`,
        type: step.type,
        provider: (route.data?.selectedProvider ?? "local") as AutomationJob["provider"],
        status: "pending",
        payload: { contentId: content.id, channelId: channel.id },
        createdAt: new Date().toISOString(),
      };

      if (step.type === "safety_check") {
        const safety = await safetyComplianceEngine.validate(content);
        job.status = safety.data?.passed ? "completed" : "failed";
        if (!safety.data?.passed && channel.publishingMode === "fully_automatic") {
          job.status = "failed";
          pipelineJobs.push(job);
          this.jobs.push(job);
          return { success: false, error: "Safety check failed", data: pipelineJobs };
        }
      } else if (channel.publishingMode === "manual" && step.type === "schedule_publish") {
        job.status = "pending";
      } else {
        job.status = "completed";
        job.completedAt = new Date().toISOString();
      }

      pipelineJobs.push(job);
      this.jobs.push(job);
    }

    return { success: true, data: pipelineJobs, provider: "automation_orchestrator" };
  }

  async runDailyAutomation(channels: YouTubeChannel[]): Promise<EngineResult<{ processed: number }>> {
    let processed = 0;

    for (const channel of channels.filter((c) => c.isActive)) {
      const plan = await productionOrchestrator.plan({
        channel,
        topic: "Daily automated content",
        availableResources: ["pexels", "pixabay"],
      });

      if (plan.data) {
        const fill = await evergreenQueueEngine.fillGap(channel.id, 0, channel.shortsPerDay);
        if (fill.data) processed++;
      }
    }

    return { success: true, data: { processed }, provider: "automation_orchestrator" };
  }

  getActiveJobs(): AutomationJob[] {
    return this.jobs.filter((j) => j.status === "pending" || j.status === "running");
  }

  getRecentJobs(limit = 20): AutomationJob[] {
    return [...this.jobs].reverse().slice(0, limit);
  }
}

export const automationOrchestrator = new AutomationOrchestrator();
