"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrendOpportunity } from "@/types";
import { TrendingUp, Zap, Loader2 } from "lucide-react";

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendOpportunity[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trends").then((r) => r.json()).then((d) => setTrends(d.data ?? []));
  }, []);

  async function createPipeline(trendId: string) {
    setLoading(trendId);
    setResult(null);
    try {
      const res = await fetch(`/api/trends/${trendId}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      });
      const data = await res.json();
      if (data.success) setResult(`Created ${data.data.generated} Shorts — check Library and Review Queue`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <DashboardHeader title="Trend Discovery" description="Live Google Trends + curated opportunities" />
      <div className="space-y-4 p-4 lg:p-8">
        {result && <Card className="border-primary/30"><CardContent className="p-4 text-sm">{result}</CardContent></Card>}
        {trends.map((trend) => (
          <Card key={trend.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />{trend.topic}
                  </CardTitle>
                  <CardDescription>Source: {trend.source.replace(/_/g, " ")}</CardDescription>
                </div>
                <Badge variant="success">Score: {trend.score}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {trend.suggestedAngles.map((angle) => (
                  <Badge key={angle} variant="secondary">{angle}</Badge>
                ))}
              </div>
              <Button size="sm" disabled={loading === trend.id} onClick={() => createPipeline(trend.id)}>
                {loading === trend.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                Auto-Create Pipeline (3 Shorts)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
