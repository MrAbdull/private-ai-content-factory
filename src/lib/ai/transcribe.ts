import { config } from "@/lib/config";
import { routeTranscribe } from "@/lib/ai/providers/router";

export async function transcribeAudio(buffer: Buffer, fileName: string): Promise<string> {
  const hasProvider = config.hasGroq || config.hasGemini || config.hasOpenAI;
  if (!hasProvider) {
    return `[Audio file: ${fileName} — add GROQ_API_KEY or GEMINI_API_KEY for free transcription]`;
  }

  try {
    const { text } = await routeTranscribe(buffer, fileName);
    return text;
  } catch (e) {
    console.error("All transcribe providers failed:", e);
    return `[Transcription failed for ${fileName}]`;
  }
}

export function isAudioFile(fileName: string, mime?: string): boolean {
  const audioExt = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".mp4", ".mpeg"];
  const lower = fileName.toLowerCase();
  return audioExt.some((e) => lower.endsWith(e)) || (mime?.startsWith("audio/") ?? false);
}
