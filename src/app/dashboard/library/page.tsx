"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import type { ContentItem } from "@/types";
import { Copy, RefreshCw, Search, Play } from "lucide-react";

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/content${q}`);
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function duplicate(id: string) {
    await fetch(`/api/content/${id}/duplicate`, { method: "POST" });
    load();
  }

  async function regenerate(id: string) {
    await fetch(`/api/content/${id}/regenerate`, { method: "POST" });
    load();
  }

  return (
    <>
      <DashboardHeader title="Content Library" description="All scripts, drafts, videos, thumbnails, and metadata" />
      <div className="space-y-4 p-4 lg:p-8">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Button variant="outline" onClick={load}>Search</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatDuration(item.durationSeconds)}</span>
                      <span>{item.hashtags.slice(0, 3).join(" ")}</span>
                      {item.versions.length > 0 && <span>{item.versions.length} versions</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {item.videoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.videoUrl} target="_blank" rel="noreferrer">
                          <Play className="h-3 w-3" /> Preview
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => duplicate(item.id)}>
                      <Copy className="h-3 w-3" /> Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => regenerate(item.id)}>
                      <RefreshCw className="h-3 w-3" /> Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && <p className="text-muted-foreground text-center py-12">No content yet. Try Content Blast or import a source.</p>}
          </div>
        )}
      </div>
    </>
  );
}
