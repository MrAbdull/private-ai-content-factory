import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { config } from "@/lib/config";
import { routeSynthesizeSpeech } from "@/lib/ai/providers/router";
import type { TtsProvider } from "@/lib/ai/providers/types";

const exec = promisify(execFile);

export interface TtsResult {
  audioPath: string;
  durationSeconds: number;
  provider: TtsProvider | "silent";
}

export async function generateNarration(
  contentId: string,
  script: string,
  targetDuration: number,
  voice = config.ttsVoice
): Promise<TtsResult> {
  const dir = path.join(process.cwd(), config.dataDir, "media");
  await fs.mkdir(dir, { recursive: true });
  const audioPath = path.join(dir, `${contentId}-narration.mp3`);

  const narrationText = script
    .replace(/\[.*?\]/g, "")
    .replace(/HOOK:/gi, "")
    .replace(/\n+/g, " ")
    .trim();

  if (narrationText.length > 0 && (config.hasEdgeTts || config.hasOpenAI)) {
    try {
      const { provider } = await routeSynthesizeSpeech(script, audioPath, voice);
      const duration = await probeDuration(audioPath);
      return { audioPath, durationSeconds: duration, provider };
    } catch (e) {
      console.error("All TTS providers failed:", e);
    }
  }

  await exec("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
    "-t", String(targetDuration),
    "-c:a", "libmp3lame", "-q:a", "9",
    audioPath,
  ], { timeout: 30000 });

  return { audioPath, durationSeconds: targetDuration, provider: "silent" };
}

async function probeDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await exec("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", filePath,
    ], { timeout: 10000 });
    return parseFloat(stdout.trim()) || 25;
  } catch {
    return 25;
  }
}
