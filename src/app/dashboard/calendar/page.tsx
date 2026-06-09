"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { mockChannels, mockContent } from "@/lib/mock-data";
import { format, addDays, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CalendarPage() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const scheduled = mockContent.filter((c) => c.status === "scheduled" || c.status === "published");

  return (
    <>
      <DashboardHeader
        title="Content Calendar"
        description="Drafts, scheduled uploads, publishing queues, and plans"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-7">
          {days.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayContent = scheduled.filter((c) => {
              const date = c.scheduledAt ?? c.publishedAt;
              return date && format(new Date(date), "yyyy-MM-dd") === dayStr;
            });

            return (
              <Card key={dayStr} className="min-h-[200px]">
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
                      className="rounded-md border border-border bg-secondary/30 p-2 text-xs cursor-grab active:cursor-grabbing"
                      draggable
                    >
                      <p className="font-medium line-clamp-2">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                  {dayContent.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No content</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" /> Channel Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockChannels.map((ch) => (
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
