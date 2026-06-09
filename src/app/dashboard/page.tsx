import { DashboardHeader } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChannels, getContent, getJobs } from "@/lib/store/database";
import { resourceManagementEngine } from "@/lib/engines/resource-management";
import { formatNumber } from "@/lib/utils";
import { Activity, Calendar, Film, TrendingUp, Youtube, Zap } from "lucide-react";

export default async function DashboardPage() {
  const channels = await getChannels();
  const content = await getContent();
  const jobs = await getJobs(10);
  const resources = resourceManagementEngine.getUsageSnapshot();

  const scheduled = content.filter((c) => c.status === "scheduled").length;
  const published = content.filter((c) => c.status === "published").length;
  const review = content.filter((c) => c.status === "review").length;
  const totalShortsPerDay = channels.reduce((s, c) => s + c.shortsPerDay, 0);
  const activeJobs = jobs.filter((j) => j.status === "pending" || j.status === "running").length;

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Autonomous content production studio — all channels at a glance"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Connected Channels" value={channels.length} icon={Youtube} subtitle={`${totalShortsPerDay} Shorts/day`} />
          <StatCard title="In Review" value={review} icon={Zap} subtitle="Awaiting approval" />
          <StatCard title="Scheduled" value={scheduled} icon={Calendar} subtitle="Ready to publish" />
          <StatCard title="Published" value={published} icon={Film} subtitle="Live on YouTube" />
          <StatCard title="Active Jobs" value={activeJobs} icon={Activity} subtitle="Processing now" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Youtube className="h-5 w-5" /> Channel Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">{ch.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ch.shortsPerDay} Shorts/day · {ch.publishingMode.replace(/_/g, " ")}
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
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Recent Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.durationSeconds}s · {item.videoUrl ? "video ready" : "no video"}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Resource Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.slice(0, 6).map((r) => (
                <div key={r.provider} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{String(r.provider).replace(/_/g, " ")}</p>
                    <Badge variant={r.health === "healthy" ? "success" : "warning"}>{r.health}</Badge>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (r.quotaUsed / r.quotaLimit) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
