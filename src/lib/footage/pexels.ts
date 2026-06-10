import { config } from "@/lib/config";
import type { FootageClip } from "@/lib/engines/video-resource-orchestrator";

export async function searchPexelsVideos(query: string, perPage = 5): Promise<FootageClip[]> {
  if (!config.hasPexels) return [];

  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
    { headers: { Authorization: process.env.PEXELS_API_KEY! } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.videos ?? []).map((v: { id: number; video_files: { link: string; width: number }[] }) => {
    const file = v.video_files?.find((f) => f.width <= 1080) ?? v.video_files?.[0];
    return {
      id: `pexels-${v.id}`,
      provider: "pexels" as const,
      url: file?.link ?? "",
      query,
      relevanceScore: 0.85,
      qualityScore: 0.8,
      diversityScore: 0.75,
    };
  }).filter((c: FootageClip) => c.url);
}
