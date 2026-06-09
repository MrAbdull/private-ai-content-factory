import { config } from "@/lib/config";
import type { YouTubeChannel } from "@/types";

export interface GeneratedScript {
  title: string;
  hook: string;
  script: string;
  description: string;
  hashtags: string[];
}

export async function generateScript(
  topic: string,
  channel: YouTubeChannel,
  durationSeconds: number
): Promise<GeneratedScript> {
  if (config.hasOpenAI) {
    try {
      return await generateWithOpenAI(topic, channel, durationSeconds);
    } catch (e) {
      console.error("OpenAI generation failed, using template:", e);
    }
  }
  return generateTemplate(topic, channel, durationSeconds);
}

async function generateWithOpenAI(
  topic: string,
  channel: YouTubeChannel,
  durationSeconds: number
): Promise<GeneratedScript> {
  const p = channel.personality;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You write YouTube Shorts scripts. Style: ${channel.contentStyle}. Audience: ${p.audienceProfile}. Tone: ${p.tone}. Writing: ${p.writingStyle}. Duration: ${durationSeconds}s. Return JSON: {title, hook, script, description, hashtags[]}`,
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      temperature: 0.8,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content) as GeneratedScript;
  return {
    title: parsed.title?.slice(0, 100) ?? topic,
    hook: parsed.hook ?? `Did you know about ${topic}?`,
    script: parsed.script ?? "",
    description: parsed.description ?? topic,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : ["#shorts"],
  };
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

export async function generateFromSource(
  sourceText: string,
  channel: YouTubeChannel,
  angle?: string
): Promise<GeneratedScript> {
  const topic = angle ?? sourceText.slice(0, 80);
  const condensed = sourceText.slice(0, 2000);
  if (config.hasOpenAI) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.openaiModel,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Repurpose source material into a YouTube Short script. Channel style: ${channel.contentStyle}. Return JSON: {title, hook, script, description, hashtags[]}`,
            },
            { role: "user", content: `Source:\n${condensed}\n\nAngle: ${topic}` },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return JSON.parse(data.choices[0].message.content) as GeneratedScript;
      }
    } catch {
      /* fallback */
    }
  }
  return generateTemplate(topic, channel, 25);
}
