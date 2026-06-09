import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

export function scriptToCues(script: string, totalDuration: number): CaptionCue[] {
  const lines = script
    .split("\n")
    .map((l) => l.replace(/\[.*?\]/g, "").replace(/HOOK:/gi, "").trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return [{ start: 0, end: totalDuration, text: "..." }];
  }

  const slice = totalDuration / lines.length;
  return lines.map((text, i) => ({
    start: i * slice,
    end: Math.min(totalDuration, (i + 1) * slice),
    text: text.slice(0, 80),
  }));
}

export function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map((cue, i) => {
      const idx = i + 1;
      return `${idx}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`;
    })
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
  const cues = scriptToCues(script, duration);
  await fs.writeFile(srtPath, cuesToSrt(cues), "utf-8");
  return srtPath;
}
