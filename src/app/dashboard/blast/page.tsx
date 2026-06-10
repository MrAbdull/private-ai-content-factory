"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { YouTubeChannel } from "@/types";
import { Zap, Loader2, CheckCircle } from "lucide-react";

const PRESET_COUNTS = [5, 10, 25, 50];

export default function BlastPage() {
  const [topic, setTopic] = useState("Teacher Interview Tips");
  const [count, setCount] = useState(5);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ operationId: string; contentIds: string[]; generated: number; estimatedMinutes: number } | null>(null);

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => {
      setChannels(d.data ?? []);
      setSelectedChannels((d.data ?? []).map((c: YouTubeChannel) => c.id));
    });
  }, []);

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
    setSelectedChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  return (
    <>
      <DashboardHeader title="Content Blast" description="Generate unique Shorts with scripts, footage, thumbnails, and scheduling" />
      <div className="space-y-6 p-4 lg:p-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Blast Configuration</CardTitle>
            <CardDescription>Full pipeline: AI script → 3 versions → footage → FFmpeg render → safety check → schedule/review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Number of Shorts</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COUNTS.map((n) => (
                  <Button key={n} variant={count === n ? "default" : "outline"} size="sm" onClick={() => setCount(n)}>{n}</Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Each Short is fully rendered via FFmpeg. Higher counts take longer.</p>
            </div>
            <div className="space-y-2">
              <Label>Target Channels</Label>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => (
                  <Button key={ch.id} variant={selectedChannels.includes(ch.id) ? "default" : "outline"} size="sm" onClick={() => toggleChannel(ch.id)}>
                    {ch.name}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleBlast} disabled={loading || !topic || selectedChannels.length === 0} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? "Generating & Rendering..." : `Launch Content Blast (${count} Shorts)`}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /> Blast Complete</CardTitle>
              <CardDescription>Operation {result.operationId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Generated <Badge>{result.generated}</Badge> fully rendered Shorts</p>
              <p className="text-sm text-muted-foreground">Check Content Library, Review Queue, or Calendar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
