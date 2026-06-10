import type { YouTubeChannel } from "@/types";

export type ScriptProvider = "groq" | "gemini" | "openai";
export type TtsProvider = "edge" | "openai";
export type TranscribeProvider = "groq" | "gemini" | "openai";

export interface GeneratedScript {
  title: string;
  hook: string;
  script: string;
  description: string;
  hashtags: string[];
}

export interface ScriptRequest {
  topic: string;
  channel: YouTubeChannel;
  durationSeconds: number;
}

export interface SourceScriptRequest {
  sourceText: string;
  channel: YouTubeChannel;
  angle?: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly status?: number,
    readonly retryable = false
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function isRetryableProviderError(err: unknown): boolean {
  if (err instanceof ProviderError) return err.retryable;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate") ||
      msg.includes("quota") ||
      msg.includes("limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("overloaded")
    );
  }
  return false;
}

export function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Model response did not contain JSON");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

export function normalizeScript(parsed: Partial<GeneratedScript>, fallbackTopic: string): GeneratedScript {
  return {
    title: (parsed.title ?? fallbackTopic).slice(0, 100),
    hook: parsed.hook ?? `Did you know about ${fallbackTopic}?`,
    script: parsed.script ?? "",
    description: parsed.description ?? fallbackTopic,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : ["#shorts"],
  };
}

export function buildScriptSystemPrompt(channel: YouTubeChannel, durationSeconds: number): string {
  const p = channel.personality;
  return `You write YouTube Shorts scripts. Style: ${channel.contentStyle}. Audience: ${p.audienceProfile}. Tone: ${p.tone}. Writing: ${p.writingStyle}. Duration: ${durationSeconds}s. Return JSON only: {title, hook, script, description, hashtags[]}`;
}

export function buildSourceSystemPrompt(channel: YouTubeChannel): string {
  return `Repurpose source material into a YouTube Short script. Channel style: ${channel.contentStyle}. Return JSON only: {title, hook, script, description, hashtags[]}`;
}
