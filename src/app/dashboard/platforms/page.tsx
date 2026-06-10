"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlatformConnection } from "@/types/platforms";
import { Share2, Check, X } from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube Shorts",
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  facebook: "Facebook Reels",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
};

export default function PlatformsPage() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [crossPost, setCrossPost] = useState<string[]>(["youtube"]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/platforms");
    const data = await res.json();
    setConnections(data.connections ?? []);
    setCrossPost(data.crossPostDefaults ?? ["youtube"]);
  }

  useEffect(() => { load(); }, []);

  function togglePlatform(platform: string) {
    setCrossPost((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  async function saveDefaults() {
    setSaving(true);
    await fetch("/api/platforms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crossPostDefaults: crossPost }),
    });
    setSaving(false);
    load();
  }

  return (
    <>
      <DashboardHeader
        title="Platforms"
        description="Multi-platform publishing — YouTube, TikTok, Instagram, Facebook, LinkedIn, X"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" /> Connection Status
            </CardTitle>
            <CardDescription>Configure API keys in .env.local — mock publish when unset</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {connections.map((c) => (
              <div key={c.platform} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{PLATFORM_LABELS[c.platform] ?? c.platform}</p>
                  {c.accountName && <p className="text-xs text-muted-foreground">{c.accountName}</p>}
                </div>
                <Badge variant={c.configured ? "success" : "outline"}>
                  {c.configured ? (
                    <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>
                  ) : (
                    <span className="flex items-center gap-1"><X className="h-3 w-3" /> Mock</span>
                  )}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Cross-Post Targets</CardTitle>
            <CardDescription>New content publishes to all selected platforms on schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant={crossPost.includes(key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlatform(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Button onClick={saveDefaults} disabled={saving}>
              {saving ? "Saving…" : "Save Defaults"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Environment Variables</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1 font-mono text-xs">
            <p>YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET</p>
            <p>TIKTOK_CLIENT_KEY / TIKTOK_ACCESS_TOKEN</p>
            <p>META_APP_ID / META_ACCESS_TOKEN / META_IG_USER_ID / META_PAGE_ID</p>
            <p>LINKEDIN_ACCESS_TOKEN / LINKEDIN_AUTHOR_URN</p>
            <p>X_API_BEARER_TOKEN</p>
            <p>CLOUDFLARE_R2_* (optional CDN storage)</p>
            <p>GOOGLE_SERVICE_ACCOUNT_JSON (private Google Docs)</p>
            <p>DEFAULT_CROSS_POST_PLATFORMS=youtube,tiktok,instagram</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
