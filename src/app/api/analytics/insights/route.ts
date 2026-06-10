import { NextResponse } from "next/server";
import { getMetrics, getContent } from "@/lib/store/database";

export async function GET() {
  const metrics = await getMetrics();
  const content = await getContent({ status: "published" });

  const withMetrics = content
    .map((c) => ({ content: c, metrics: metrics.find((m) => m.contentId === c.id) }))
    .filter((x) => x.metrics);

  const top = [...withMetrics].sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0)).slice(0, 5);
  const weak = [...withMetrics].filter((x) => (x.metrics?.retentionRate ?? 1) < 0.4).slice(0, 5);

  const patterns = {
    topHooks: top.map((x) => x.content.hook).filter(Boolean),
    topStyles: top.map((x) => x.content.style),
    weakTitles: weak.map((x) => x.content.title),
    recommendations: [
      weak.length > 0 ? "Regenerate weak performers with curiosity-gap hooks" : null,
      top.length > 0 ? `Double down on "${top[0]?.content.style.replace(/_/g, " ")}" style` : null,
      "Publish during configured channel peak slots",
    ].filter(Boolean),
  };

  return NextResponse.json({ success: true, data: { top, weak, patterns } });
}
