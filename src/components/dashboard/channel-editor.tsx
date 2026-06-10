"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_STYLES, PUBLISHING_MODES } from "@/lib/constants";
import type { YouTubeChannel, PublishingMode, ContentStyle } from "@/types";
import { X, Save } from "lucide-react";

export function ChannelEditor({
  channel,
  onClose,
  onSaved,
}: {
  channel: YouTubeChannel;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: channel.name,
    shortsPerDay: channel.shortsPerDay,
    publishingMode: channel.publishingMode,
    contentStyle: channel.contentStyle,
    publishSlots: (channel.publishSlots ?? ["09:00", "15:00", "21:00"]).join(", "),
    audienceProfile: channel.personality.audienceProfile,
    writingStyle: channel.personality.writingStyle,
    tone: channel.personality.tone,
    pacing: channel.personality.pacing,
    ttsVoice: (channel.personality.voiceSettings?.voice as string) ?? "alloy",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          shortsPerDay: form.shortsPerDay,
          publishingMode: form.publishingMode,
          contentStyle: form.contentStyle,
          publishSlots: form.publishSlots.split(",").map((s) => s.trim()).filter(Boolean),
          personality: {
            ...channel.personality,
            audienceProfile: form.audienceProfile,
            writingStyle: form.writingStyle,
            tone: form.tone,
            pacing: form.pacing,
            voiceSettings: { ...channel.personality.voiceSettings, voice: form.ttsVoice },
          },
        }),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configure Channel</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shorts / Day</Label>
              <Input type="number" min={1} max={20} value={form.shortsPerDay}
                onChange={(e) => setForm({ ...form, shortsPerDay: parseInt(e.target.value) || 3 })} />
            </div>
            <div className="space-y-2">
              <Label>TTS Voice</Label>
              <Input value={form.ttsVoice} onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}
                placeholder="alloy, echo, fable..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Publish Slots (comma-separated times)</Label>
            <Input value={form.publishSlots} onChange={(e) => setForm({ ...form, publishSlots: e.target.value })}
              placeholder="09:00, 15:00, 21:00" />
          </div>
          <div className="space-y-2">
            <Label>Publishing Mode</Label>
            <div className="flex flex-wrap gap-2">
              {PUBLISHING_MODES.map((m) => (
                <Button key={m.value} size="sm" type="button"
                  variant={form.publishingMode === m.value ? "default" : "outline"}
                  onClick={() => setForm({ ...form, publishingMode: m.value as PublishingMode })}>
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Content Style</Label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_STYLES.slice(0, 6).map((s) => (
                <Button key={s.value} size="sm" type="button"
                  variant={form.contentStyle === s.value ? "default" : "outline"}
                  onClick={() => setForm({ ...form, contentStyle: s.value as ContentStyle })}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Audience Profile</Label>
            <Input value={form.audienceProfile} onChange={(e) => setForm({ ...form, audienceProfile: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Writing Style</Label>
            <Input value={form.writingStyle} onChange={(e) => setForm({ ...form, writingStyle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Pacing</Label>
              <Input value={form.pacing} onChange={(e) => setForm({ ...form, pacing: e.target.value as "slow" | "medium" | "fast" })} />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
