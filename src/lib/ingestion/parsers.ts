import type { SourceType } from "@/types";

export interface ParsedSource {
  title: string;
  rawContent: string;
  metadata: Record<string, unknown>;
}

export async function parseSourceInput(
  type: SourceType,
  input: string,
  fileName?: string,
  fileBuffer?: Buffer
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
      return parsePdf(fileBuffer, fileName, input);
    case "podcast":
    case "transcript":
      return {
        title: fileName ?? "Transcript",
        rawContent: input,
        metadata: { type, wordCount: input.split(/\s+/).length },
      };
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

async function parsePdf(buffer?: Buffer, fileName?: string, fallbackText?: string): Promise<ParsedSource> {
  if (buffer && buffer.length > 0) {
    try {
      const pdfModule = await import("pdf-parse");
      const pdfParse = "default" in pdfModule && pdfModule.default
        ? pdfModule.default
        : (pdfModule as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>);
      const data = await (pdfParse as (buf: Buffer) => Promise<{ text: string; numpages: number }>)(buffer);
      return {
        title: fileName ?? "PDF Document",
        rawContent: data.text.slice(0, 50000),
        metadata: { type: "pdf", pages: data.numpages, fileName },
      };
    } catch (e) {
      console.error("PDF parse error:", e);
    }
  }
  return {
    title: fileName ?? "PDF Document",
    rawContent: fallbackText || "[Could not parse PDF — paste extracted text as raw_text]",
    metadata: { type: "pdf", parseError: true },
  };
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

  let transcript = "";
  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = segments.map((s: { text: string }) => s.text).join(" ");
  } catch {
    transcript = "";
  }

  const rawContent = transcript.length > 50
    ? `Title: ${title}\n\nTranscript:\n${transcript.slice(0, 50000)}`
    : `YouTube video: ${title}\nVideo ID: ${videoId}\nURL: ${url}\n\n[No auto-transcript available — paste transcript manually as transcript source type]`;

  return {
    title,
    rawContent,
    metadata: { sourceUrl: url, videoId, platform: "youtube", hasTranscript: transcript.length > 50 },
  };
}

async function parseGoogleDocUrl(url: string): Promise<ParsedSource> {
  try {
    const { fetchGoogleDocContent } = await import("@/lib/google/drive");
    const doc = await fetchGoogleDocContent(url);
    return {
      title: doc.title,
      rawContent: doc.text.slice(0, 50000),
      metadata: { sourceUrl: url, viaDriveApi: true },
    };
  } catch (e) {
    const exportUrl = url.includes("/edit")
      ? url.replace(/\/edit.*$/, "/export?format=txt")
      : url;
    try {
      const res = await fetch(exportUrl, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const text = await res.text();
        return { title: "Google Doc", rawContent: text.slice(0, 15000), metadata: { sourceUrl: url } };
      }
    } catch { /* ignore */ }
    return {
      title: "Google Doc",
      rawContent: `Google Doc URL: ${url}\n\n${e instanceof Error ? e.message : "Export failed"} — paste text manually.`,
      metadata: { sourceUrl: url, needsManualExport: true },
    };
  }
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
