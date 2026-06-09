import type { SourceType } from "@/types";

export interface ParsedSource {
  title: string;
  rawContent: string;
  metadata: Record<string, unknown>;
}

export async function parseSourceInput(
  type: SourceType,
  input: string,
  fileName?: string
): Promise<ParsedSource> {
  switch (type) {
    case "url":
    case "blog_post":
    case "article":
      return parseUrl(input);
    case "youtube_video":
      return parseYouTubeUrl(input);
    case "google_doc":
      return parseGoogleDocUrl(input);
    case "pdf":
      return parsePdfPlaceholder(input, fileName);
    case "podcast":
      return { title: fileName ?? "Podcast transcript", rawContent: input, metadata: { type: "podcast" } };
    case "transcript":
    case "script":
    case "notes":
    case "raw_text":
    case "text_prompt":
    case "uploaded_file":
    default:
      return {
        title: (fileName ?? input.slice(0, 60)) || "Untitled source",
        rawContent: input,
        metadata: { type, charCount: input.length },
      };
  }
}

async function parseUrl(url: string): Promise<ParsedSource> {
  const res = await fetch(url, {
    headers: { "User-Agent": "PrivateContentFactory/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const title = extractTag(html, "title") ?? new URL(url).hostname;
  const text = stripHtml(html).replace(/\s+/g, " ").trim().slice(0, 15000);
  return {
    title,
    rawContent: text,
    metadata: { sourceUrl: url, wordCount: text.split(/\s+/).length },
  };
}

async function parseYouTubeUrl(url: string): Promise<ParsedSource> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  let title = `YouTube Video ${videoId}`;
  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (oembed.ok) {
      const data = await oembed.json();
      title = data.title ?? title;
    }
  } catch { /* ignore */ }

  return {
    title,
    rawContent: `YouTube video: ${title}\nVideo ID: ${videoId}\nURL: ${url}\n\n[Transcript extraction requires youtube-transcript integration — paste transcript manually or use OpenAI on title/description for Shorts angles.]`,
    metadata: { sourceUrl: url, videoId, platform: "youtube" },
  };
}

async function parseGoogleDocUrl(url: string): Promise<ParsedSource> {
  const exportUrl = url.includes("/edit")
    ? url.replace(/\/edit.*$/, "/export?format=txt")
    : url;
  try {
    const res = await fetch(exportUrl, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const text = await res.text();
      return {
        title: "Google Doc",
        rawContent: text.slice(0, 15000),
        metadata: { sourceUrl: url },
      };
    }
  } catch { /* ignore */ }
  return {
    title: "Google Doc (manual)",
    rawContent: `Google Doc URL: ${url}\n\nExport the doc as text and re-import, or paste content directly.`,
    metadata: { sourceUrl: url, needsManualExport: true },
  };
}

function parsePdfPlaceholder(content: string, fileName?: string): ParsedSource {
  return {
    title: fileName ?? "PDF Document",
    rawContent: content || "[PDF binary uploaded — install pdf-parse for full extraction. Paste extracted text as raw_text source.]",
    metadata: { type: "pdf", fileName },
  };
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
