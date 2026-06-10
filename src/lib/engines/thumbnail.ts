import type { ThumbnailVariant } from "@/types";
import type { EngineResult } from "./types";

/**
 * AI Thumbnail Generator — multiple variants with CTR prediction.
 */
export class ThumbnailEngine {
  async generateVariants(contentId: string, title: string): Promise<EngineResult<ThumbnailVariant[]>> {
    const layouts = ["text_left", "text_center", "split_screen", "face_closeup"];
    const headlines = [
      title.slice(0, 40),
      title.split(" ").slice(0, 4).join(" ").toUpperCase(),
      `⚡ ${title.slice(0, 30)}`,
      title.replace(/\s+/g, "\n").slice(0, 50),
    ];

    const variants: ThumbnailVariant[] = layouts.map((layout, i) => ({
      id: `thumb-${contentId}-${i}`,
      contentId,
      headline: headlines[i % headlines.length],
      layout,
      predictedCtr: this.predictCtr(headlines[i % headlines.length], layout),
      isSelected: false,
    }));

    const best = variants.reduce((a, b) => (a.predictedCtr > b.predictedCtr ? a : b));
    best.isSelected = true;

    return { success: true, data: variants, provider: "thumbnail_engine" };
  }

  private predictCtr(headline: string, layout: string): number {
    let score = 0.04;
    if (headline.length < 35) score += 0.01;
    if (headline.includes("⚡") || headline === headline.toUpperCase()) score += 0.015;
    if (layout === "text_center") score += 0.008;
    if (layout === "split_screen") score += 0.005;
    return Math.min(0.12, score + Math.random() * 0.02);
  }
}

export const thumbnailEngine = new ThumbnailEngine();
