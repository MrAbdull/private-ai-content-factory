import type { ContentSource } from "@/types";
import type { EngineResult, RepurposeResult } from "./types";

/**
 * Auto-Repurposing Engine — multiple angles from one source.
 */
export class RepurposingEngine {
  async repurpose(source: ContentSource): Promise<EngineResult<RepurposeResult>> {
    const keyPoints = this.extractKeyPoints(source.rawContent);
    const audiences = ["beginners", "professionals", "curious learners", "skeptics"];

    const opportunities = keyPoints.flatMap((point) =>
      audiences.slice(0, 2).map((audience) => ({
        angle: `${point} — for ${audience}`,
        hook: this.generateHook(point, audience),
        audience,
      }))
    ).slice(0, 12);

    const contentIds = opportunities.map(
      (_, i) => `repurpose-${source.id}-${i}`
    );

    return {
      success: true,
      data: { sourceId: source.id, opportunities, contentIds },
      provider: "repurposing_engine",
    };
  }

  private extractKeyPoints(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    if (sentences.length === 0) {
      return ["Core insight from source material", "Actionable takeaway", "Surprising fact"];
    }
    return sentences.slice(0, 5).map((s) => s.trim().slice(0, 80));
  }

  private generateHook(point: string, audience: string): string {
    return `For ${audience}: ${point.slice(0, 50)}...`;
  }
}

export const repurposingEngine = new RepurposingEngine();
