import type { ContentItem, VideoVersion } from "@/types";
import type { EngineResult, VersionScore } from "./types";

/**
 * Multi-Version Testing Engine — produces 3+ distinct versions per Short.
 */
export class MultiVersionEngine {
  async generateVersions(content: ContentItem): Promise<EngineResult<VideoVersion[]>> {
    const strategies = [
      { hook: "curiosity_gap", narration: "question_led", pacing: "fast_start", editing: "jump_cuts", captions: "bold_center" },
      { hook: "bold_claim", narration: "authoritative", pacing: "steady", editing: "b_roll_heavy", captions: "keyword_highlight" },
      { hook: "story_open", narration: "conversational", pacing: "building", editing: "narrative_arc", captions: "subtitle_bar" },
    ];

    const versions: VideoVersion[] = strategies.map((s, i) => ({
      id: `ver-${content.id}-${i + 1}`,
      contentId: content.id,
      versionNumber: i + 1,
      hook: this.applyHookStrategy(content.hook, s.hook),
      script: content.script,
      narrationStyle: s.narration,
      pacingStrategy: s.pacing,
      editingStyle: s.editing,
      captionStyle: s.captions,
      predictedScore: 0,
      isSelected: false,
    }));

    const scored = this.scoreVersions(versions);
    const best = scored.sort((a, b) => b.overallScore - a.overallScore)[0];
    if (best) {
      best.version.predictedScore = best.overallScore;
      best.version.isSelected = true;
    }

    return { success: true, data: versions, provider: "multi_version" };
  }

  scoreVersions(versions: VideoVersion[]): VersionScore[] {
    return versions.map((v) => {
      const hookScore = this.scoreHook(v.hook);
      const retentionScore = v.pacingStrategy === "fast_start" ? 0.82 : v.pacingStrategy === "building" ? 0.78 : 0.75;
      const engagementScore = v.editingStyle === "jump_cuts" ? 0.85 : 0.72;
      const overallScore = hookScore * 0.35 + retentionScore * 0.35 + engagementScore * 0.3;
      return { version: v, hookScore, retentionScore, engagementScore, overallScore };
    });
  }

  private applyHookStrategy(baseHook: string, strategy: string): string {
    switch (strategy) {
      case "curiosity_gap":
        return `Did you know... ${baseHook}?`;
      case "bold_claim":
        return `This changes everything: ${baseHook}`;
      case "story_open":
        return `Last week I discovered ${baseHook.toLowerCase()}`;
      default:
        return baseHook;
    }
  }

  private scoreHook(hook: string): number {
    const powerWords = ["secret", "mistake", "hack", "never", "stop", "truth"];
    const matches = powerWords.filter((w) => hook.toLowerCase().includes(w)).length;
    return Math.min(0.95, 0.6 + matches * 0.1 + (hook.length < 60 ? 0.1 : 0));
  }
}

export const multiVersionEngine = new MultiVersionEngine();
