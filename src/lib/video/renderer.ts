import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { config } from "@/lib/config";
import { generateNarration } from "@/lib/ai/tts";
import { writeSrtFile } from "@/lib/video/captions";

const exec = promisify(execFile);

export interface RenderInput {
  contentId: string;
  hook: string;
  script: string;
  durationSeconds: number;
  footageUrl?: string;
  voice?: string;
}

export interface RenderOutput {
  videoPath: string;
  videoUrl: string;
  thumbnailPath: string;
  thumbnailUrl: string;
  hasNarration: boolean;
  hasCaptions: boolean;
}

function outputDir(): string {
  return path.join(process.cwd(), config.dataDir, "media");
}

export async function renderShort(input: RenderInput): Promise<RenderOutput> {
  const dir = outputDir();
  await fs.mkdir(dir, { recursive: true });

  const videoPath = path.join(dir, `${input.contentId}.mp4`);
  const thumbnailPath = path.join(dir, `${input.contentId}-thumb.jpg`);
  const hookText = sanitizeText(input.hook).slice(0, 80);

  const tts = await generateNarration(
    input.contentId,
    input.script,
    input.durationSeconds,
    input.voice ?? "alloy"
  );

  const duration = Math.max(input.durationSeconds, Math.ceil(tts.durationSeconds));
  const srtPath = await writeSrtFile(input.contentId, input.script, duration);
  const srtEscaped = srtPath.replace(/:/g, "\\:").replace(/'/g, "'\\''");

  if (input.footageUrl) {
    try {
      await renderWithFootage(input, videoPath, hookText, tts.audioPath, srtEscaped, duration);
    } catch {
      await renderPlaceholder(input, videoPath, hookText, tts.audioPath, srtEscaped, duration);
    }
  } else {
    await renderPlaceholder(input, videoPath, hookText, tts.audioPath, srtEscaped, duration);
  }

  await generateThumbnail(videoPath, thumbnailPath, hookText);

  return {
    videoPath,
    videoUrl: `/api/media/${input.contentId}.mp4`,
    thumbnailPath,
    thumbnailUrl: `/api/media/${input.contentId}-thumb.jpg`,
    hasNarration: tts.provider === "openai",
    hasCaptions: true,
  };
}

async function renderPlaceholder(
  input: RenderInput,
  outputPath: string,
  hookText: string,
  audioPath: string,
  srtPath: string,
  duration: number
): Promise<void> {
  const escaped = escapeDrawtext(hookText);
  const subStyle = "FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=120";

  await exec("ffmpeg", [
    "-y",
    "-f", "lavfi",
    "-i", `color=c=0x1a1a2e:s=1080x1920:d=${duration}`,
    "-i", audioPath,
    "-vf",
    `drawtext=text='${escaped}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=180:box=1:boxcolor=black@0.5:boxborderw=16,subtitles='${srtPath}':force_style='${subStyle}'`,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-pix_fmt", "yuv420p",
    "-t", String(duration),
    "-shortest",
    outputPath,
  ], { timeout: 180000 });
}

async function renderWithFootage(
  input: RenderInput,
  outputPath: string,
  hookText: string,
  audioPath: string,
  srtPath: string,
  duration: number
): Promise<void> {
  const tempFootage = path.join(outputDir(), `${input.contentId}-footage.mp4`);
  const res = await fetch(input.footageUrl!);
  if (!res.ok) throw new Error("Footage download failed");
  await fs.writeFile(tempFootage, Buffer.from(await res.arrayBuffer()));

  const escaped = escapeDrawtext(hookText);
  const subStyle = "FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=140";

  await exec("ffmpeg", [
    "-y",
    "-i", tempFootage,
    "-i", audioPath,
    "-vf",
    `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawtext=text='${escaped}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=120:box=1:boxcolor=black@0.6:boxborderw=14,subtitles='${srtPath}':force_style='${subStyle}'`,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-pix_fmt", "yuv420p",
    "-t", String(duration),
    "-shortest",
    outputPath,
  ], { timeout: 180000 });

  await fs.unlink(tempFootage).catch(() => {});
}

async function generateThumbnail(
  videoPath: string,
  thumbPath: string,
  hookText: string
): Promise<void> {
  try {
    await exec("ffmpeg", [
      "-y", "-i", videoPath, "-ss", "00:00:01", "-vframes", "1", thumbPath,
    ], { timeout: 30000 });
  } catch {
    const escaped = escapeDrawtext(hookText);
    await exec("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "color=c=0x16213e:s=1280x720",
      "-vf", `drawtext=text='${escaped}':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
      "-vframes", "1", thumbPath,
    ], { timeout: 30000 });
  }
}

function sanitizeText(text: string): string {
  return text.replace(/['"\\]/g, "").replace(/\n/g, " ");
}

function escapeDrawtext(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "'\\''").replace(/:/g, "\\:");
}
