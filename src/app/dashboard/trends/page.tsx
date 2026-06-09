"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrendOpportunity } from "@/types";
import { TrendingUp, Zap } from "lucide-react";

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendOpportunity[]>([]);

  useEffect(() => {
    fetch("/api/trends").then((r) => r.json()).then((d) => setTrends(d.data ?? []));
  }, []);

  return (
    <>
      <DashboardHeader title="Trend Discovery" description="Emerging opportunities from YouTube, Google Trends, Reddit, and news" />
      <div className="space-y-4 p-4 lg:p-8">
        {trends.map((trend) => (
          <Card key={trend.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {trend.topic}
                  </CardTitle>
                  <CardDescription>Source: {trend.source.replace(/_/g, " ")}</CardDescription>
                </div>
                <Badge variant="success">Score: {trend.score}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Suggested angles:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {trend.suggestedAngles.map((angle) => (
                  <Badge key={angle} variant="secondary">{angle}</Badge>
                ))}
              </div>
              <Button size="sm" asChild>
                <a href={`/dashboard/blast?topic=${encodeURIComponent(trend.topic)}`}>
                  <Zap className="h-3 w-3" /> Create Pipeline from Trend
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
