"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ContentItem } from "@/types";
import { Check, X, Play, Zap } from "lucide-react";

export default function ReviewPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/review");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string, scheduleNow = false) {
    await fetch(`/api/content/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleNow }),
    });
    load();
  }

  async function reject(id: string) {
    await fetch(`/api/content/${id}/reject`, { method: "POST" });
    load();
  }

  async function approveAll() {
    for (const item of items) {
      await approve(item.id);
    }
  }

  return (
    <>
      <DashboardHeader
        title="Review Queue"
        description="Manual and semi-automatic approval — approve batches before publishing"
      />
      <div className="space-y-4 p-4 lg:p-8">
        {items.length > 1 && (
          <Button onClick={approveAll}>
            <Zap className="h-4 w-4" /> Approve All ({items.length})
          </Button>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No content awaiting review. Fully automatic channels skip this queue.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.hook}</p>
                    <div className="flex gap-2 mt-2">
                      <StatusBadge status={item.status} />
                      <Badge variant="secondary">{item.durationSeconds}s</Badge>
                      {item.versions.length > 0 && <Badge variant="outline">{item.versions.length} versions tested</Badge>}
                    </div>
                  </div>
                  {item.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="w-24 h-14 object-cover rounded" />
                  )}
                </div>
                <p className="text-sm line-clamp-3 whitespace-pre-wrap">{item.script}</p>
                <div className="flex gap-2 flex-wrap">
                  {item.videoUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={item.videoUrl} target="_blank" rel="noreferrer">
                        <Play className="h-3 w-3" /> Preview Video
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => approve(item.id, true)}>
                    <Check className="h-3 w-3" /> Approve & Publish Now
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => approve(item.id)}>
                    <Check className="h-3 w-3" /> Approve & Schedule
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(item.id)}>
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
