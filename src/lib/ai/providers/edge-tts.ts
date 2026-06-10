import { promises as fs } from "fs";
import path from "path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { config } from "@/lib/config";
import { ProviderError } from "./types";

export async function edgeSynthesizeSpeech(text: string, outputPath: string): Promise<void> {
  const narration = text
    .replace(/\[.*?\]/g, "")
    .replace(/HOOK:/gi, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 3000);

  if (!narration) throw new ProviderError("No narration text for Edge TTS", "edge");

  const tts = new MsEdgeTTS();
  await tts.setMetadata(config.edgeTtsVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  const { audioFilePath } = await tts.toFile(dir, narration);
  await fs.rename(audioFilePath, outputPath);
  tts.close();
}
