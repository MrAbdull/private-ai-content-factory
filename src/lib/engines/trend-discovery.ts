import type { TrendOpportunity } from "@/types";
import type { EngineResult, TrendScanResult } from "./types";

const MOCK_TRENDS = [
  { topic: "AI side hustles 2025", source: "google_trends", score: 92 },
  { topic: "Teacher interview tips", source: "youtube_trending", score: 87 },
  { topic: "Business growth hacks", source: "reddit", score: 84 },
  { topic: "Productivity micro habits", source: "news", score: 79 },
  { topic: "Remote work tools", source: "google_trends", score: 76 },
];

/**
 * Trend Discovery Engine — monitors trends and recommends pipelines.
 */
export class TrendDiscoveryEngine {
  async scan(sources: string[] = ["youtube", "google_trends", "reddit", "news"]): Promise<EngineResult<TrendScanResult>> {
    const opportunities: TrendOpportunity[] = MOCK_TRENDS.map((t, i) => ({
      id: `trend-${i}`,
      topic: t.topic,
      source: t.source,
      score: t.score,
      suggestedAngles: [
        `Beginner guide: ${t.topic}`,
        `Advanced: ${t.topic}`,
        `Myths about ${t.topic}`,
      ],
      detectedAt: new Date().toISOString(),
    }));

    return {
      success: true,
      data: { opportunities, scannedSources: sources },
      provider: "trend_discovery",
    };
  }
}

export const trendDiscoveryEngine = new TrendDiscoveryEngine();
