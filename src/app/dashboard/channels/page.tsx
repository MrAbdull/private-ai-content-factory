import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockChannels } from "@/lib/mock-data";
import { CONTENT_STYLES, PUBLISHING_MODES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { Plus, Settings2 } from "lucide-react";

export default function ChannelsPage() {
  return (
    <>
      <DashboardHeader
        title="YouTube Channels"
        description="Manage connected channels, personalities, and publishing schedules"
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="flex justify-end">
          <Button>
            <Plus className="h-4 w-4" /> Connect Channel
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {mockChannels.map((channel) => {
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
                      {channel.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subscribers</p>
                      <p className="font-semibold">{formatNumber(channel.subscriberCount ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shorts / Day</p>
                      <p className="font-semibold">{channel.shortsPerDay}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Style</p>
                      <p className="font-semibold">{styleLabel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Publishing</p>
                      <p className="font-semibold">{modeLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                    <p className="font-medium mb-1">Channel Personality</p>
                    <p className="text-muted-foreground text-xs">{channel.personality.audienceProfile}</p>
                    <p className="text-muted-foreground text-xs mt-1">Tone: {channel.personality.tone} · Pacing: {channel.personality.pacing}</p>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Settings2 className="h-4 w-4" /> Configure Personality
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
