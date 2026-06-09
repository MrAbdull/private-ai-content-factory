"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, Clock, Users, ThumbsUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface InsightsData {
  patterns: { topHooks: string[]; recommendations: string[] };
  weak: { content: { title: string }; metrics?: { retentionRate: number } }[];
}

interface AnalyticsData {
  summary: {
    totalViews: string;
    watchTimeHours: string;
    retentionPercent: string;
    subscribersGained: number;
    publishedCount: number;
  };
  chartData: { name: string; views: number }[];
  metrics: { likes: number; comments: number; shares: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then((d) => setData(d.data));
    fetch("/api/analytics/insights").then((r) => r.json()).then((d) => setInsights(d.data));
  }, []);

  const topMetric = data?.metrics?.[0];

  return (
    <>
      <DashboardHeader title="Analytics" description="Performance intelligence — views, retention, CTR, growth" />
      <div className="space-y-6 p-4 lg:p-8">
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Views" value={data.summary.totalViews} icon={Eye} />
              <StatCard title="Watch Time" value={`${data.summary.watchTimeHours}h`} icon={Clock} />
              <StatCard title="Retention" value={`${data.summary.retentionPercent}%`} icon={BarChart3} />
              <StatCard title="Subscribers Gained" value={data.summary.subscribersGained} icon={Users} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Shorts</CardTitle>
                <CardDescription>{data.summary.publishedCount} published — syncs with YouTube when OAuth connected</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {data.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="views" fill="oklch(0.55 0.22 265)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-12">Publish content to see analytics</p>
                )}
              </CardContent>
            </Card>
            {insights && (
              <Card>
                <CardHeader><CardTitle>Performance Intelligence</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {insights.patterns.recommendations.map((r) => (
                    <p key={r} className="text-muted-foreground">→ {r}</p>
                  ))}
                  {insights.patterns.topHooks.slice(0, 3).map((h) => (
                    <p key={h} className="text-xs border-l-2 border-primary pl-2">Top hook: {h}</p>
                  ))}
                  {insights.weak.length > 0 && (
                    <p className="text-amber-500 text-xs">{insights.weak.length} underperforming — auto-regenerate jobs queued on cron</p>
                  )}
                </CardContent>
              </Card>
            )}
            {topMetric && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ThumbsUp className="h-4 w-4" /> Engagement</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-2xl font-bold">{topMetric.likes}</p><p className="text-sm text-muted-foreground">Likes</p></div>
                    <div><p className="text-2xl font-bold">{topMetric.comments}</p><p className="text-sm text-muted-foreground">Comments</p></div>
                    <div><p className="text-2xl font-bold">{topMetric.shares}</p><p className="text-sm text-muted-foreground">Shares</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
