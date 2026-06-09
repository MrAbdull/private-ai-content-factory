"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTENT_STYLES, PUBLISHING_MODES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { YouTubeChannel } from "@/types";
import { ChannelEditor } from "@/components/dashboard/channel-editor";
import { Plus, Settings2, Youtube } from "lucide-react";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [editing, setEditing] = useState<YouTubeChannel | null>(null);

  async function load() {
    const res = await fetch("/api/channels");
    const data = await res.json();
    setChannels(data.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function connectYouTube() {
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect_url" }),
    });
    const data = await res.json();
    if (data.authUrl) window.location.href = data.authUrl;
  }

  async function addManualChannel() {
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_manual", name: `Channel ${channels.length + 1}` }),
    });
    load();
  }

  return (
    <>
      <DashboardHeader title="YouTube Channels" description="Connect and manage channels with independent schedules" />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={addManualChannel}>
            <Plus className="h-4 w-4" /> Add Channel
          </Button>
          <Button onClick={connectYouTube}>
            <Youtube className="h-4 w-4" /> Connect via YouTube OAuth
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel) => {
            const styleLabel = CONTENT_STYLES.find((s) => s.value === channel.contentStyle)?.label;
            const modeLabel = PUBLISHING_MODES.find((m) => m.value === channel.publishingMode)?.label;

            return (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{channel.name}</CardTitle>
                      <CardDescription>{channel.youtubeChannelId}</CardDescription>
                    </div>
                    <Badge variant={channel.isActive ? "success" : "secondary"}>
                      {channel.oauthTokens ? "Connected" : channel.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Subscribers</p><p className="font-semibold">{formatNumber(channel.subscriberCount ?? 0)}</p></div>
                    <div><p className="text-muted-foreground">Shorts / Day</p><p className="font-semibold">{channel.shortsPerDay}</p></div>
                    <div><p className="text-muted-foreground">Style</p><p className="font-semibold">{styleLabel}</p></div>
                    <div><p className="text-muted-foreground">Publishing</p><p className="font-semibold">{modeLabel}</p></div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                    <p className="font-medium mb-1">Channel Personality</p>
                    <p className="text-muted-foreground text-xs">{channel.personality.audienceProfile}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setEditing(channel)}>
                    <Settings2 className="h-4 w-4" /> Configure Personality
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {editing && (
          <ChannelEditor channel={editing} onClose={() => setEditing(null)} onSaved={load} />
        )}
      </div>
    </>
  );
}
