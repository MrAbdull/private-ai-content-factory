import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockTrends } from "@/lib/mock-data";
import { TrendingUp, Zap } from "lucide-react";

export default function TrendsPage() {
  return (
    <>
      <DashboardHeader
        title="Trend Discovery"
        description="Emerging opportunities from YouTube, Google Trends, Reddit, and news"
      />
      <div className="space-y-4 p-4 lg:p-8">
        {mockTrends.map((trend) => (
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
              <Button size="sm">
                <Zap className="h-3 w-3" /> Create Pipeline from Trend
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
