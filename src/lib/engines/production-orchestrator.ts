import type { ContentStyle } from "@/types";
import type { EngineResult, ProductionContext, ProductionPlan } from "./types";

const STYLE_RULES: Record<
  ContentStyle,
  { pacing: string; narration: string; captions: string; transitions: string }
> = {
  faceless_documentary: { pacing: "medium", narration: "authoritative", captions: "minimal_lower_third", transitions: "crossfade" },
  educational: { pacing: "medium", narration: "clear_instructor", captions: "keyword_highlight", transitions: "cut" },
  business_explainer: { pacing: "fast", narration: "professional", captions: "bullet_points", transitions: "slide" },
  storytelling: { pacing: "variable", narration: "dramatic", captions: "narrative", transitions: "fade" },
  news_reporter: { pacing: "fast", narration: "urgent", captions: "headline", transitions: "wipe" },
  viral_social: { pacing: "very_fast", narration: "energetic", captions: "bold_center", transitions: "jump_cut" },
  reddit_story: { pacing: "medium", narration: "casual", captions: "full_screen_text", transitions: "static" },
  motivational: { pacing: "building", narration: "inspirational", captions: "quote_style", transitions: "zoom" },
  corporate: { pacing: "steady", narration: "polished", captions: "brand_lower_third", transitions: "smooth" },
  minimalist: { pacing: "slow", narration: "calm", captions: "sparse", transitions: "fade" },
  custom_brand: { pacing: "custom", narration: "custom", captions: "custom", transitions: "custom" },
};

/**
 * Autonomous AI Production Orchestrator
 * Analyzes context and decides production workflow without user intervention.
 */
export class ProductionOrchestrator {
  async plan(context: ProductionContext): Promise<EngineResult<ProductionPlan>> {
    const style = context.channel.contentStyle;
    const rules = STYLE_RULES[style];
    const personality = context.channel.personality;

    const avgRetention = context.historicalPerformance?.length
      ? context.historicalPerformance.reduce((s, m) => s + m.retentionRate, 0) /
        context.historicalPerformance.length
      : 0.45;

    const durationSeconds = avgRetention < 0.4 ? 15 : avgRetention > 0.6 ? 30 : 22;
    const hooks = this.generateHooks(context.topic, personality.tone, style);

    const plan: ProductionPlan = {
      style,
      durationSeconds,
      hooks,
      scriptOutline: [
        `Hook: ${hooks[0]}`,
        `Problem/context aligned to ${personality.audienceProfile}`,
        `Key insight with ${personality.writingStyle} tone`,
        `Call to action matching ${personality.postingStrategy}`,
      ],
      footageStrategy: `Diversify across providers; avoid repeats; ${rules.pacing} pacing`,
      narrationStyle: rules.narration,
      captionFormat: rules.captions,
      publishingSlot: this.suggestPublishingSlot(context.channel.shortsPerDay),
    };

    return { success: true, data: plan, provider: "production_orchestrator" };
  }

  private generateHooks(topic: string, tone: string, style: ContentStyle): string[] {
    const templates: Record<string, string[]> = {
      viral_social: [`Nobody talks about this ${topic} hack`, `Stop scrolling — ${topic} in 15 seconds`],
      educational: [`The #1 mistake with ${topic}`, `Here's what experts won't tell you about ${topic}`],
      motivational: [`If you're struggling with ${topic}, watch this`, `${topic} changed everything for me`],
    };
    return templates[style] ?? [
      `Why ${topic} matters right now`,
      `The truth about ${topic}`,
      `${tone}: ${topic} explained`,
    ];
  }

  private suggestPublishingSlot(shortsPerDay: number): string {
    const slots = ["09:00", "13:00", "17:00", "20:00", "22:00"];
    return slots.slice(0, shortsPerDay).join(", ");
  }
}

export const productionOrchestrator = new ProductionOrchestrator();
