import { DashboardHeader } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockChannels, mockContent, mockJobs, mockSystemHealth } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { Activity, Calendar, Film, TrendingUp, Youtube, Zap } from "lucide-react";

export default function DashboardPage() {
  const scheduled = mockContent.filter((c) => c.status === "scheduled").length;
  const published = mockContent.filter((c) => c.status === "published").length;
  const totalShortsPerDay = mockChannels.reduce((s, c) => s + c.shortsPerDay, 0);

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Autonomous content production studio — all channels at a glance"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Connected Channels" value={mockChannels.length} icon={Youtube} subtitle={`${totalShortsPerDay} Shorts/day total`} />
          <StatCard title="Scheduled" value={scheduled} icon={Calendar} subtitle="Ready to publish" />
          <StatCard title="Published" value={published} icon={Film} subtitle="This pipeline" />
          <StatCard title="Active Jobs" value={mockSystemHealth.activeJobs} icon={Activity} subtitle={`${mockSystemHealth.failedJobs24h} failed (24h)`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5" /> Channel Pipeline
              </CardTitle>
              <CardDescription>Independent publishing schedules per channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockChannels.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">{ch.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ch.shortsPerDay} Shorts/day · {ch.publishingMode.replace("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatNumber(ch.subscriberCount ?? 0)} subs</p>
                    <Badge variant="secondary" className="mt-1">{ch.contentStyle.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" /> Recent Content
              </CardTitle>
              <CardDescription>Latest pipeline activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockContent.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.durationSeconds}s · {item.style.replace(/_/g, " ")}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> System Health
            </CardTitle>
            <CardDescription>Automation providers and resource utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...mockSystemHealth.automation, ...mockSystemHealth.footage].map((r) => (
                <div key={r.provider} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{r.provider.replace(/_/g, " ")}</p>
                    <Badge variant={r.health === "healthy" ? "success" : r.health === "degraded" ? "warning" : "destructive"}>
                      {r.health}
                    </Badge>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (r.quotaUsed / r.quotaLimit) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(r.quotaUsed)} / {formatNumber(r.quotaLimit)} quota
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Queue</CardTitle>
            <CardDescription>Recent autonomous jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <span className="font-medium capitalize">{job.type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{job.provider.replace(/_/g, " ")}</span>
                <Badge variant={job.status === "completed" ? "success" : job.status === "running" ? "warning" : "secondary"}>
                  {job.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
