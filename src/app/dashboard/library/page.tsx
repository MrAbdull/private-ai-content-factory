"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONTENT_STYLES } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import type { ContentItem, ContentStatus, YouTubeChannel } from "@/types";
import { Copy, RefreshCw, Search, Play } from "lucide-react";

const STATUSES: ContentStatus[] = ["draft", "generating", "review", "scheduled", "published", "failed", "archived"];

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [channelId, setChannelId] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (channelId) params.set("channelId", channelId);
    if (style) params.set("style", style);
    const res = await fetch(`/api/content?${params}`);
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }, [search, status, channelId, style]);

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(d.data ?? []));
    load();
  }, [load]);

  return (
    <>
      <DashboardHeader title="Content Library" description="Search, filter, duplicate, and regenerate" />
      <div className="space-y-4 p-4 lg:p-8">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          </div>
          <Button variant="outline" onClick={load}>Apply</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!status ? "default" : "outline"} onClick={() => setStatus("")}>All</Button>
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>{s}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!channelId ? "default" : "outline"} onClick={() => setChannelId("")}>All Channels</Button>
          {channels.map((c) => (
            <Button key={c.id} size="sm" variant={channelId === c.id ? "default" : "outline"} onClick={() => setChannelId(c.id)}>{c.name}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTENT_STYLES.slice(0, 6).map((s) => (
            <Button key={s.value} size="sm" variant={style === s.value ? "default" : "outline"} onClick={() => setStyle(style === s.value ? "" : s.value)}>{s.label}</Button>
          ))}
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : (
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
                      <span>{item.style.replace(/_/g, " ")}</span>
                      {item.versions.length > 0 && <span>{item.versions.length} versions</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {item.videoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.videoUrl} target="_blank" rel="noreferrer"><Play className="h-3 w-3" /> Preview</a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={async () => { await fetch(`/api/content/${item.id}/duplicate`, { method: "POST" }); load(); }}>
                      <Copy className="h-3 w-3" /> Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => { await fetch(`/api/content/${item.id}/regenerate`, { method: "POST" }); load(); }}>
                      <RefreshCw className="h-3 w-3" /> Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && <p className="text-center text-muted-foreground py-12">No content matches filters.</p>}
          </div>
        )}
      </div>
    </>
  );
}
