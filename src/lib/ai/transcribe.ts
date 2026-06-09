import { config } from "@/lib/config";

export async function transcribeAudio(buffer: Buffer, fileName: string): Promise<string> {
  if (!config.hasOpenAI) {
    return `[Audio file: ${fileName} — set OPENAI_API_KEY for Whisper transcription]`;
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), fileName);
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Whisper failed: ${res.status}`);
  return (await res.text()).slice(0, 50000);
}

export function isAudioFile(fileName: string, mime?: string): boolean {
  const audioExt = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".mp4", ".mpeg"];
  const lower = fileName.toLowerCase();
  return audioExt.some((e) => lower.endsWith(e)) || (mime?.startsWith("audio/") ?? false);
}
