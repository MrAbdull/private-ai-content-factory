import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockJobs, mockSystemHealth } from "@/lib/mock-data";
import { resourceManagementEngine } from "@/lib/engines/resource-management";
import { formatNumber } from "@/lib/utils";
import { Bot, Server } from "lucide-react";

export default function AutomationPage() {
  const routingExamples = ["video_render", "storage_upload", "scheduled_publish"].map((task) =>
    resourceManagementEngine.routeTask(task)
  );

  return (
    <>
      <DashboardHeader
        title="Automation"
        description="Self-managing orchestration across GitHub Actions, Cloudflare, Supabase, and Vercel"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{mockSystemHealth.activeJobs}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{mockSystemHealth.queueDepth}</p>
              <p className="text-sm text-muted-foreground">Queue Depth</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-500">{mockSystemHealth.failedJobs24h}</p>
              <p className="text-sm text-muted-foreground">Failed (24h)</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> Resource Routing</CardTitle>
            <CardDescription>AI Resource Management Engine — automatic provider selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {routingExamples.map((route, i) => (
              <div key={i} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{route.data?.task.replace(/_/g, " ")}</span>
                  <Badge>{route.data?.selectedProvider.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-muted-foreground mt-1">{route.data?.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <span className="capitalize">{job.type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{job.provider.replace(/_/g, " ")}</span>
                <Badge variant={job.status === "completed" ? "success" : "warning"}>{job.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Quotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {resourceManagementEngine.getUsageSnapshot().map((r) => (
                <div key={r.provider} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="capitalize font-medium">{r.provider.replace(/_/g, " ")}</span>
                    <Badge variant={r.health === "healthy" ? "success" : "warning"}>{r.health}</Badge>
                  </div>
                  <p className="text-muted-foreground">{formatNumber(r.quotaUsed)} / {formatNumber(r.quotaLimit)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
