import { NextResponse } from "next/server";
import { getMetrics, getContent, getChannels } from "@/lib/store/database";
import { formatNumber } from "@/lib/utils";

export async function GET() {
  const metrics = await getMetrics();
  const content = await getContent();
  const channels = await getChannels();

  const published = content.filter((c) => c.status === "published");
  const totalViews = metrics.reduce((s, m) => s + m.views, 0);
  const totalWatchTime = metrics.reduce((s, m) => s + m.watchTimeSeconds, 0);
  const avgRetention =
    metrics.length > 0
      ? metrics.reduce((s, m) => s + m.retentionRate, 0) / metrics.length
      : 0;
  const totalSubs = metrics.reduce((s, m) => s + m.subscribersGained, 0);

  const chartData = published.map((c) => {
    const m = metrics.find((x) => x.contentId === c.id);
    return {
      id: c.id,
      name: c.title.slice(0, 24),
      views: m?.views ?? 0,
      retention: ((m?.retentionRate ?? 0) * 100).toFixed(0),
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalViews: formatNumber(totalViews),
        totalViewsRaw: totalViews,
        watchTimeHours: (totalWatchTime / 3600).toFixed(1),
        retentionPercent: (avgRetention * 100).toFixed(0),
        subscribersGained: totalSubs,
        publishedCount: published.length,
        channelCount: channels.length,
      },
      chartData,
      metrics,
    },
  });
}
