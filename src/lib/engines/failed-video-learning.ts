import type { ContentItem, PerformanceMetrics } from "@/types";
import type { EngineResult } from "./types";

export interface FailureAnalysis {
  contentId: string;
  likelyCauses: string[];
  improvements: string[];
  improvedHook?: string;
  improvedTitle?: string;
}

/**
 * Failed Video Learning Engine — learns from underperforming content.
 */
export class FailedVideoLearningEngine {
  async analyze(
    content: ContentItem,
    metrics: PerformanceMetrics
  ): Promise<EngineResult<FailureAnalysis>> {
    const causes: string[] = [];
    const improvements: string[] = [];

    if (metrics.retentionRate < 0.35) {
      causes.push("weak_hook", "poor_pacing");
      improvements.push("Use curiosity-gap hook in first 2 seconds", "Increase cut frequency");
    }
    if (metrics.clickThroughRate < 0.04) {
      causes.push("weak_thumbnail", "weak_title");
      improvements.push("Test bold text thumbnail", "Add power words to title");
    }
    if (metrics.views < 100 && metrics.retentionRate > 0.5) {
      causes.push("publishing_time", "topic_selection");
      improvements.push("Reschedule to peak hours", "Align with trending topics");
    }
    if (causes.length === 0) {
      causes.push("audience_mismatch");
      improvements.push("Refine channel personality targeting");
    }

    return {
      success: true,
      data: {
        contentId: content.id,
        likelyCauses: causes,
        improvements,
        improvedHook: `Wait — ${content.hook}`,
        improvedTitle: `${content.title} (Updated)`,
      },
      provider: "failed_video_learning",
    };
  }
}

export const failedVideoLearningEngine = new FailedVideoLearningEngine();
