"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { format, addDays, startOfWeek } from "date-fns";
import type { ContentItem, YouTubeChannel } from "@/types";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CalendarPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    Promise.all([
      fetch("/api/content").then((r) => r.json()),
      fetch("/api/channels").then((r) => r.json()),
    ]).then(([c, ch]) => {
      setContent((c.data ?? []).filter((i: ContentItem) => i.scheduledAt || i.publishedAt));
      setChannels(ch.data ?? []);
    });
  }, []);

  async function reschedule(itemId: string, newDate: string) {
    await fetch(`/api/content/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: newDate, status: "scheduled" }),
    });
    const res = await fetch("/api/content");
    const data = await res.json();
    setContent((data.data ?? []).filter((i: ContentItem) => i.scheduledAt || i.publishedAt));
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("contentId");
    if (!itemId) return;
    const d = new Date(day);
    d.setHours(12, 0, 0, 0);
    reschedule(itemId, d.toISOString());
  }

  return (
    <>
      <DashboardHeader title="Content Calendar" description="Drag content to reschedule — updates publishing queue" />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-7">
          {days.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayContent = content.filter((c) => {
              const date = c.scheduledAt ?? c.publishedAt;
              return date && format(new Date(date), "yyyy-MM-dd") === dayStr;
            });

            return (
              <Card
                key={dayStr}
                className="min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, day)}
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {format(day, "EEE")}
                    <span className="block text-xs text-muted-foreground font-normal">{format(day, "MMM d")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {dayContent.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("contentId", item.id)}
                      className="rounded-md border border-border bg-secondary/30 p-2 text-xs cursor-grab active:cursor-grabbing"
                    >
                      <p className="font-medium line-clamp-2">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CalendarIcon className="h-4 w-4" /> Unscheduled Content</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {content.filter((c) => !c.scheduledAt && c.status !== "published").map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("contentId", item.id)}
                className="rounded-md border border-border px-3 py-2 text-xs cursor-grab"
              >
                {item.title.slice(0, 30)}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Channel Schedules</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.id} className="flex justify-between items-center rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{ch.name}</span>
                <span className="text-muted-foreground">{ch.shortsPerDay} Shorts/day · {ch.publishingMode.replace(/_/g, " ")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
