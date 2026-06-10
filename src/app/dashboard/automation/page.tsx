"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { AutomationJob } from "@/types";
import { Bot, Server, Play } from "lucide-react";

export default function AutomationPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [, setJobs] = useState<AutomationJob[]>([]);
  const [cronResult, setCronResult] = useState<string | null>(null);

  async function load() {
    const [hRes] = await Promise.all([fetch("/api/health")]);
    const h = await hRes.json();
    setHealth(h);
    setJobs([]);
  }

  useEffect(() => { load(); }, []);

  async function runCron() {
    const res = await fetch("/api/cron/process", {
      method: "POST",
      headers: { "x-cron-secret": "dev-cron-secret" },
    });
    const data = await res.json();
    setCronResult(JSON.stringify(data.data, null, 2));
    load();
  }

  const resources = (health?.resources as { provider: string; quotaUsed: number; quotaLimit: number; health: string }[]) ?? [];

  return (
    <>
      <DashboardHeader title="Automation" description="Self-managing orchestration — GitHub Actions, Cloudflare, Supabase, Vercel" />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="flex gap-2">
          <Button onClick={runCron}>
            <Play className="h-4 w-4" /> Run Cron Now (publish + evergreen + trends)
          </Button>
        </div>

        {cronResult && (
          <Card>
            <CardContent className="p-4">
              <pre className="text-xs overflow-auto">{cronResult}</pre>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{health?.activeJobs as number ?? 0}</p><p className="text-sm text-muted-foreground">Active Jobs</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{health?.queueDepth as number ?? 0}</p><p className="text-sm text-muted-foreground">Queue Depth</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-amber-500">{health?.failedJobs24h as number ?? 0}</p><p className="text-sm text-muted-foreground">Failed (24h)</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> Provider Health</CardTitle>
            <CardDescription>AI Resource Management Engine</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <div key={r.provider} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="capitalize font-medium">{r.provider.replace(/_/g, " ")}</span>
                  <Badge variant={r.health === "healthy" ? "success" : "warning"}>{r.health}</Badge>
                </div>
                <p className="text-muted-foreground">{formatNumber(r.quotaUsed)} / {formatNumber(r.quotaLimit)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {health?.config ? (
          <Card>
            <CardHeader><CardTitle>Integration Status</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(health.config as Record<string, boolean>).map(([k, v]) => (
                <Badge key={k} variant={v ? "success" : "outline"}>{k}: {v ? "connected" : "not configured"}</Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Setup Cron</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Add a GitHub Action or cron job to POST <code>/api/cron/process</code> with header <code>x-cron-secret: YOUR_CRON_SECRET</code></p>
            <p>Runs: scheduled publishing, evergreen gap fill, trend refresh</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
