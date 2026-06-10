"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ContentItem } from "@/types";
import { Archive, Trash2 } from "lucide-react";

interface EvergreenItem {
  contentId: string;
  channelId: string;
  priority: number;
  addedAt: string;
  content?: ContentItem;
}

export default function EvergreenPage() {
  const [queue, setQueue] = useState<EvergreenItem[]>([]);

  async function load() {
    const res = await fetch("/api/evergreen");
    const data = await res.json();
    setQueue(data.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function remove(contentId: string) {
    await fetch(`/api/evergreen?contentId=${contentId}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <DashboardHeader title="Evergreen Reserve" description="Backup content that auto-fills scheduling gaps" />
      <div className="space-y-4 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          {queue.length} items in reserve. Cron auto-uses these when a channel falls below its daily Short target.
        </p>
        {queue.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No evergreen content yet. Scheduled Shorts are added automatically.</CardContent></Card>
        ) : (
          queue.map((item) => (
            <Card key={item.contentId}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-primary" />
                    <span className="font-medium">{item.content?.title ?? item.contentId}</span>
                    <Badge variant="secondary">P{item.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Channel: {item.channelId} · Added {new Date(item.addedAt).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => remove(item.contentId)}>
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
