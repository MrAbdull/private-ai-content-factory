import { config } from "@/lib/config";
import { routeGenerateFromSource, routeGenerateScript, type GeneratedScript } from "@/lib/ai/providers/router";
import type { YouTubeChannel } from "@/types";

export type { GeneratedScript };

function hasAnyScriptProvider(): boolean {
  return config.hasGroq || config.hasGemini || config.hasOpenAI;
}

export async function generateScript(
  topic: string,
  channel: YouTubeChannel,
  durationSeconds: number
): Promise<GeneratedScript> {
  if (!hasAnyScriptProvider()) {
    return generateTemplate(topic, channel, durationSeconds);
  }

  try {
    const { script } = await routeGenerateScript(topic, channel, durationSeconds);
    return script;
  } catch (e) {
    console.error("All script providers failed, using template:", e);
    return generateTemplate(topic, channel, durationSeconds);
  }
}

export async function generateFromSource(
  sourceText: string,
  channel: YouTubeChannel,
  angle?: string
): Promise<GeneratedScript> {
  const topic = angle ?? sourceText.slice(0, 80);

  if (!hasAnyScriptProvider()) {
    return generateTemplate(topic, channel, 25);
  }

  try {
    const { script } = await routeGenerateFromSource(sourceText, channel, angle);
    return script;
  } catch (e) {
    console.error("All source script providers failed, using template:", e);
    return generateTemplate(topic, channel, 25);
  }
}

function generateTemplate(
  topic: string,
  channel: YouTubeChannel,
  durationSeconds: number
): GeneratedScript {
  const hook = channel.contentStyle === "viral_social"
    ? `Stop scrolling — this ${topic} hack is insane`
    : `The #1 mistake people make with ${topic}`;

  const script = [
    `[0-3s] HOOK: ${hook}`,
    `[3-${Math.floor(durationSeconds * 0.4)}s] Context for ${channel.personality.audienceProfile}`,
    `[${Math.floor(durationSeconds * 0.4)}-${durationSeconds - 5}s] Key insight about ${topic}`,
    `[${durationSeconds - 5}s-${durationSeconds}s] CTA: Follow for more`,
  ].join("\n");

  const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  return {
    title: `${topic} — ${channel.personality.tone} take`,
    hook,
    script,
    description: `${topic} explained in ${durationSeconds} seconds. ${channel.personality.postingStrategy}`,
    hashtags: ["#shorts", "#viral", ...words.map((w) => `#${w}`)].slice(0, 8),
  };
}
