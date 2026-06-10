import { config } from "@/lib/config";
import type { FootageClip } from "@/lib/engines/video-resource-orchestrator";

export async function searchPixabayVideos(query: string, perPage = 5): Promise<FootageClip[]> {
  if (!config.hasPixabay) return [];

  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY!,
    q: query,
    per_page: String(perPage),
    video_type: "film",
  });

  const res = await fetch(`https://pixabay.com/api/videos/?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.hits ?? []).map((h: { id: number; videos: { medium?: { url: string }; small?: { url: string } } }) => ({
    id: `pixabay-${h.id}`,
    provider: "pixabay" as const,
    url: h.videos?.medium?.url ?? h.videos?.small?.url ?? "",
    query,
    relevanceScore: 0.8,
    qualityScore: 0.75,
    diversityScore: 0.8,
  })).filter((c: FootageClip) => c.url);
}
