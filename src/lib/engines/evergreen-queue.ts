import type { ContentItem } from "@/types";
import type { EngineResult } from "./types";

/**
 * Evergreen Content Queue — fills scheduling gaps automatically.
 */
export class EvergreenQueueEngine {
  private queue: { contentId: string; channelId: string; priority: number }[] = [];

  add(contentId: string, channelId: string, priority = 0) {
    this.queue.push({ contentId, channelId, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  async fillGap(
    channelId: string,
    scheduledCount: number,
    targetPerDay: number
  ): Promise<EngineResult<ContentItem | null>> {
    const gap = targetPerDay - scheduledCount;
    if (gap <= 0) {
      return { success: true, data: null, provider: "evergreen_queue" };
    }

    const item = this.queue.find((q) => q.channelId === channelId);
    if (!item) {
      return { success: true, data: null, provider: "evergreen_queue" };
    }

    this.queue = this.queue.filter((q) => q.contentId !== item.contentId);

    return {
      success: true,
      data: {
        id: item.contentId,
        channelId,
        title: "Evergreen Short (auto-filled)",
        description: "Automatically scheduled from evergreen reserve",
        hashtags: ["#shorts"],
        script: "",
        hook: "",
        status: "scheduled",
        durationSeconds: 25,
        style: "educational",
        versions: [],
        thumbnails: [],
        createdAt: new Date().toISOString(),
      },
      provider: "evergreen_queue",
    };
  }

  getQueueDepth(channelId?: string): number {
    return channelId
      ? this.queue.filter((q) => q.channelId === channelId).length
      : this.queue.length;
  }
}

export const evergreenQueueEngine = new EvergreenQueueEngine();
