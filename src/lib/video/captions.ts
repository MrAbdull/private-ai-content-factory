import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

/** Word-level caption timing — ~2.5 words/sec with min 0.4s per word group */
export function scriptToWordCues(script: string, totalDuration: number): CaptionCue[] {
  const clean = script
    .replace(/\[.*?\]/g, "")
    .replace(/HOOK:/gi, "")
    .replace(/\n+/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [{ start: 0, end: totalDuration, text: "..." }];

  const wordsPerCue = 3;
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerCue) {
    groups.push(words.slice(i, i + wordsPerCue).join(" "));
  }

  const wps = words.length / totalDuration;
  const cues: CaptionCue[] = [];
  let t = 0;

  for (const group of groups) {
    const wordCount = group.split(/\s+/).length;
    const dur = Math.max(0.5, Math.min(wordCount / wps, totalDuration - t));
    cues.push({ start: t, end: Math.min(totalDuration, t + dur), text: group });
    t += dur;
    if (t >= totalDuration) break;
  }

  if (cues.length > 0) cues[cues.length - 1].end = totalDuration;
  return cues;
}

export function scriptToCues(script: string, totalDuration: number): CaptionCue[] {
  return scriptToWordCues(script, totalDuration);
}

export function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map((cue, i) => `${i + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`)
    .join("\n");
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export async function writeSrtFile(contentId: string, script: string, duration: number): Promise<string> {
  const dir = path.join(process.cwd(), config.dataDir, "media");
  await fs.mkdir(dir, { recursive: true });
  const srtPath = path.join(dir, `${contentId}.srt`);
  await fs.writeFile(srtPath, cuesToSrt(scriptToWordCues(script, duration)), "utf-8");
  return srtPath;
}
