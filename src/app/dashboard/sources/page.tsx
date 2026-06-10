"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SOURCE_TYPES } from "@/lib/constants";
import type { ContentSource, SourceType, YouTubeChannel } from "@/types";
import { FileInput, Loader2, Zap } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [type, setType] = useState<SourceType>("text_prompt");
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [repurposing, setRepurposing] = useState<string | null>(null);

  async function load() {
    const [sRes, cRes] = await Promise.all([
      fetch("/api/sources"),
      fetch("/api/channels"),
    ]);
    const sData = await sRes.json();
    const cData = await cRes.json();
    setSources(sData.data ?? []);
    setChannels(cData.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, input, title: title || undefined }),
      });
      setInput("");
      setTitle("");
      load();
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", file.name.endsWith(".pdf") ? "pdf" : "uploaded_file");
      if (title) form.append("title", title);
      await fetch("/api/sources", { method: "POST", body: form });
      setTitle("");
      load();
    } finally {
      setLoading(false);
    }
  }

  async function repurpose(sourceId: string, channelId: string) {
    setRepurposing(sourceId);
    try {
      const res = await fetch(`/api/sources/${sourceId}/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, maxCount: 5 }),
      });
      const data = await res.json();
      alert(`Generated ${data.count} Shorts from source. Check Content Library and Review Queue.`);
    } finally {
      setRepurposing(null);
    }
  }

  return (
    <>
      <DashboardHeader
        title="Source Materials"
        description="Import prompts, URLs, scripts, articles, YouTube videos, transcripts, and more"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileInput className="h-5 w-5" /> Import Source</CardTitle>
            <CardDescription>Paste content or provide a URL — the system will analyze and extract opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_TYPES.map((s) => (
                    <Button
                      key={s.value}
                      type="button"
                      size="sm"
                      variant={type === s.value ? "default" : "outline"}
                      onClick={() => setType(s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My source material" />
              </div>
              <div className="space-y-2">
                <Label>Content or URL</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={type === "url" ? "https://example.com/article" : "Paste your content here..."}
                  required
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileInput className="h-4 w-4" />}
                  Import Source
                </Button>
                <Label className="cursor-pointer">
                  <span className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm hover:bg-accent">
                    Upload PDF / Audio / File
                  </span>
                  <input type="file" accept=".pdf,.txt,.md,.mp3,.wav,.m4a,.ogg,.webm" className="hidden" onChange={handleFileUpload} />
                </Label>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold">Imported Sources ({sources.length})</h2>
          {sources.length === 0 ? (
            <p className="text-muted-foreground">No sources imported yet.</p>
          ) : (
            sources.map((src) => (
              <Card key={src.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{src.title}</h3>
                      <Badge variant="secondary" className="mt-1">{src.type.replace(/_/g, " ")}</Badge>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{src.rawContent.slice(0, 200)}...</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {channels.map((ch) => (
                        <Button
                          key={ch.id}
                          size="sm"
                          variant="outline"
                          disabled={repurposing === src.id}
                          onClick={() => repurpose(src.id, ch.id)}
                        >
                          {repurposing === src.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                          → {ch.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
