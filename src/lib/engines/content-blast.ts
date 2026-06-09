import { productionOrchestrator } from "./production-orchestrator";
import { channelPersonalityEngine } from "./channel-personality";
import { multiVersionEngine } from "./multi-version";
import { thumbnailEngine } from "./thumbnail";
import type { BlastRequest, ContentBlastResult, EngineResult } from "./types";
import type { ContentItem, YouTubeChannel } from "@/types";

/**
 * Content Blast Engine — generate 10, 50, 100+ Shorts from a single topic.
 */
export class ContentBlastEngine {
  async blast(
    request: BlastRequest,
    channels: YouTubeChannel[]
  ): Promise<EngineResult<ContentBlastResult>> {
    const targetChannels = channels.filter((c) => request.channelIds.includes(c.id));
    if (targetChannels.length === 0) {
      return { success: false, error: "No valid channels selected" };
    }

    const contentIds: string[] = [];
    const ideasPerChannel = Math.ceil(request.count / targetChannels.length);

    for (const channel of targetChannels) {
      const ideas = this.generateUniqueIdeas(request.topic, ideasPerChannel, channel);

      for (const idea of ideas) {
        const plan = await productionOrchestrator.plan({
          channel,
          topic: idea,
          availableResources: ["pexels", "pixabay", "openai"],
        });

        if (!plan.data) continue;

        const contentId = `blast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        contentIds.push(contentId);

        await multiVersionEngine.generateVersions({
          id: contentId,
          channelId: channel.id,
          title: channelPersonalityEngine.adaptTitle(idea, channel),
          description: `${idea} — auto-generated Short`,
          hashtags: this.generateHashtags(request.topic),
          script: plan.data.scriptOutline.join("\n"),
          hook: plan.data.hooks[0],
          status: "generating",
          durationSeconds: plan.data.durationSeconds,
          style: channel.contentStyle,
          versions: [],
          thumbnails: [],
          createdAt: new Date().toISOString(),
        } as ContentItem);

        await thumbnailEngine.generateVariants(contentId, idea);
      }
    }

    return {
      success: true,
      data: {
        operationId: `op-${Date.now()}`,
        topic: request.topic,
        requestedCount: request.count,
        contentIds,
        estimatedCompletionMinutes: Math.ceil(request.count * 2.5),
      },
      provider: "content_blast",
    };
  }

  private generateUniqueIdeas(topic: string, count: number, channel: YouTubeChannel): string[] {
    const angles = [
      `Beginner guide to ${topic}`,
      `Advanced ${topic} strategies`,
      `${topic} mistakes to avoid`,
      `${topic} in under 30 seconds`,
      `Why ${topic} is trending`,
      `My ${topic} workflow`,
      `${topic} vs alternatives`,
      `Quick ${topic} tip`,
      `${topic} for ${channel.personality.audienceProfile.split(" ")[0] ?? "everyone"}`,
      `Secret ${topic} hack`,
    ];

    const ideas: string[] = [];
    for (let i = 0; i < count; i++) {
      const base = angles[i % angles.length];
      ideas.push(i >= angles.length ? `${base} #${Math.floor(i / angles.length) + 1}` : base);
    }
    return ideas;
  }

  private generateHashtags(topic: string): string[] {
    const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return ["#shorts", "#viral", ...words.map((w) => `#${w}`)].slice(0, 8);
  }
}

export const contentBlastEngine = new ContentBlastEngine();
