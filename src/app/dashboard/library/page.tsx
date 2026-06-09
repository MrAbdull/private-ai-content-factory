import { DashboardHeader } from "@/components/dashboard/header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockChannels, mockContent } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";
import { Copy, RefreshCw, Search } from "lucide-react";

export default function LibraryPage() {
  return (
    <>
      <DashboardHeader
        title="Content Library"
        description="All sources, scripts, drafts, videos, thumbnails, and metadata"
      />
      <div className="space-y-4 p-4 lg:p-8">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search content..." className="pl-9" />
          </div>
        </div>

        <div className="space-y-3">
          {mockContent.map((item) => {
            const channel = mockChannels.find((c) => c.id === item.channelId);
            return (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{channel?.name}</span>
                      <span>{formatDuration(item.durationSeconds)}</span>
                      <span>{item.hashtags.slice(0, 3).join(" ")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm"><Copy className="h-3 w-3" /> Duplicate</Button>
                    <Button variant="outline" size="sm"><RefreshCw className="h-3 w-3" /> Regenerate</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
