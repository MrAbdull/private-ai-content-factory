"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockChannels } from "@/lib/mock-data";
import { Zap, Loader2 } from "lucide-react";

const PRESET_COUNTS = [10, 25, 50, 100];

export default function BlastPage() {
  const [topic, setTopic] = useState("Teacher Interview Tips");
  const [count, setCount] = useState(10);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(mockChannels.map((c) => c.id));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ operationId: string; contentIds: string[]; estimatedMinutes: number } | null>(null);

  async function handleBlast() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count, channelIds: selectedChannels }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } finally {
      setLoading(false);
    }
  }

  function toggleChannel(id: string) {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  return (
    <>
      <DashboardHeader
        title="Content Blast"
        description="Generate 10, 50, 100+ unique Shorts from a single topic"
      />
      <div className="space-y-6 p-4 lg:p-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Blast Configuration
            </CardTitle>
            <CardDescription>
              The system will auto-generate ideas, scripts, titles, footage selection, thumbnails, and schedules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Business Growth Hacks, AI Side Hustles"
              />
            </div>

            <div className="space-y-2">
              <Label>Number of Shorts</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COUNTS.map((n) => (
                  <Button
                    key={n}
                    variant={count === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCount(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Input
                  type="number"
                  className="w-24"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                  min={1}
                  max={500}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Channels</Label>
              <div className="flex flex-wrap gap-2">
                {mockChannels.map((ch) => (
                  <Button
                    key={ch.id}
                    variant={selectedChannels.includes(ch.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleChannel(ch.id)}
                  >
                    {ch.name}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleBlast} disabled={loading || !topic || selectedChannels.length === 0} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Launch Content Blast ({count} Shorts)
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>Blast Initiated</CardTitle>
              <CardDescription>Operation {result.operationId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Generated <Badge>{result.contentIds.length}</Badge> content items</p>
              <p className="text-sm text-muted-foreground">Est. completion: ~{result.estimatedMinutes} minutes</p>
              <p className="text-xs text-muted-foreground">
                Each Short includes 3+ versions, thumbnail variants, and autonomous scheduling
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
