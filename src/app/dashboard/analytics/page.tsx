"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockContent, mockMetrics } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { BarChart3, Eye, Clock, Users, ThumbsUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const topMetric = mockMetrics.find((m) => m.views > 0);
  const chartData = mockContent
    .filter((c) => c.status === "published")
    .map((c) => {
      const m = mockMetrics.find((x) => x.contentId === c.id);
      return { name: c.title.slice(0, 20), views: m?.views ?? 0, retention: (m?.retentionRate ?? 0) * 100 };
    });

  return (
    <>
      <DashboardHeader
        title="Analytics"
        description="Views, retention, CTR, growth, and performance intelligence"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Views" value={formatNumber(topMetric?.views ?? 0)} icon={Eye} trend={{ value: "12% vs last week", positive: true }} />
          <StatCard title="Watch Time" value={`${formatNumber((topMetric?.watchTimeSeconds ?? 0) / 3600)}h`} icon={Clock} />
          <StatCard title="Retention" value={`${((topMetric?.retentionRate ?? 0) * 100).toFixed(0)}%`} icon={BarChart3} />
          <StatCard title="Subscribers Gained" value={topMetric?.subscribersGained ?? 0} icon={Users} trend={{ value: "8% growth", positive: true }} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Shorts</CardTitle>
            <CardDescription>Performance intelligence feeds future content decisions</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ThumbsUp className="h-4 w-4" /> Engagement Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {topMetric && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold">{formatNumber(topMetric.likes)}</p><p className="text-sm text-muted-foreground">Likes</p></div>
                <div><p className="text-2xl font-bold">{topMetric.comments}</p><p className="text-sm text-muted-foreground">Comments</p></div>
                <div><p className="text-2xl font-bold">{topMetric.shares}</p><p className="text-sm text-muted-foreground">Shares</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
