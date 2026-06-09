import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { config } from "@/lib/config";

const exec = promisify(execFile);

export interface TtsResult {
  audioPath: string;
  durationSeconds: number;
  provider: "openai" | "silent";
}

export async function generateNarration(
  contentId: string,
  script: string,
  targetDuration: number,
  voice = "alloy"
): Promise<TtsResult> {
  const dir = path.join(process.cwd(), config.dataDir, "media");
  await fs.mkdir(dir, { recursive: true });
  const audioPath = path.join(dir, `${contentId}-narration.mp3`);

  const narrationText = script
    .replace(/\[.*?\]/g, "")
    .replace(/HOOK:/gi, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 4096);

  if (config.hasOpenAI && narrationText.length > 0) {
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice,
          input: narrationText,
          response_format: "mp3",
        }),
      });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(audioPath, buf);
        const duration = await probeDuration(audioPath);
        return { audioPath, durationSeconds: duration, provider: "openai" };
      }
    } catch (e) {
      console.error("OpenAI TTS failed:", e);
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
