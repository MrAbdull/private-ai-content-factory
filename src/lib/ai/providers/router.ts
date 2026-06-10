import { config } from "@/lib/config";
import type { YouTubeChannel } from "@/types";
import { geminiGenerateFromSource, geminiGenerateScript, geminiTranscribe } from "./gemini";
import { groqGenerateFromSource, groqGenerateScript, groqTranscribe } from "./groq";
import { edgeSynthesizeSpeech } from "./edge-tts";
import {
  openaiGenerateFromSource,
  openaiGenerateScript,
  openaiSynthesizeSpeech,
  openaiTranscribe,
} from "./openai-provider";
import {
  isRetryableProviderError,
  type GeneratedScript,
  type ScriptProvider,
  type TranscribeProvider,
  type TtsProvider,
} from "./types";

export type { GeneratedScript };

function providerConfigured(provider: string): boolean {
  switch (provider as ScriptProvider | TtsProvider | TranscribeProvider) {
    case "groq":
      return config.hasGroq;
    case "gemini":
      return config.hasGemini;
    case "openai":
      return config.hasOpenAI;
    case "edge":
      return config.hasEdgeTts;
    default:
      return false;
  }
}

async function tryProviders<T>(
  providers: string[],
  label: string,
  run: (provider: string) => Promise<T>
): Promise<{ result: T; provider: string }> {
  const configured = providers.filter(providerConfigured);
  if (!configured.length) {
    throw new Error(`No configured providers for ${label}`);
  }

  let lastError: unknown;
  for (const provider of configured) {
    try {
      const result = await run(provider);
      console.info(`[ai] ${label} succeeded via ${provider}`);
      return { result, provider };
    } catch (err) {
      lastError = err;
      console.warn(`[ai] ${label} failed via ${provider}:`, err instanceof Error ? err.message : err);
      if (!isRetryableProviderError(err)) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`All ${label} providers failed`);
}

export async function routeGenerateScript(
  topic: string,
  channel: YouTubeChannel,
  durationSeconds: number
): Promise<{ script: GeneratedScript; provider: string }> {
  const { result, provider } = await tryProviders(config.aiScriptProviders, "script", async (p) => {
    const req = { topic, channel, durationSeconds };
    switch (p as ScriptProvider) {
      case "groq":
        return groqGenerateScript(req);
      case "gemini":
        return geminiGenerateScript(req);
      case "openai":
        return openaiGenerateScript(req);
      default:
        throw new Error(`Unknown script provider: ${p}`);
    }
  });
  return { script: result, provider };
}

export async function routeGenerateFromSource(
  sourceText: string,
  channel: YouTubeChannel,
  angle?: string
): Promise<{ script: GeneratedScript; provider: string }> {
  const { result, provider } = await tryProviders(config.aiScriptProviders, "source script", async (p) => {
    const req = { sourceText, channel, angle };
    switch (p as ScriptProvider) {
      case "groq":
        return groqGenerateFromSource(req);
      case "gemini":
        return geminiGenerateFromSource(req);
      case "openai":
        return openaiGenerateFromSource(req);
      default:
        throw new Error(`Unknown script provider: ${p}`);
    }
  });
  return { script: result, provider };
}

export async function routeSynthesizeSpeech(
  text: string,
  outputPath: string,
  voice: string
): Promise<{ provider: TtsProvider }> {
  const { provider } = await tryProviders(config.aiTtsProviders, "tts", async (p) => {
    switch (p as TtsProvider) {
      case "edge":
        await edgeSynthesizeSpeech(text, outputPath);
        return true;
      case "openai":
        const buf = await openaiSynthesizeSpeech(text, voice);
        const { promises: fs } = await import("fs");
        await fs.writeFile(outputPath, buf);
        return true;
      default:
        throw new Error(`Unknown TTS provider: ${p}`);
    }
  });
  return { provider: provider as TtsProvider };
}

export async function routeTranscribe(buffer: Buffer, fileName: string): Promise<{ text: string; provider: string }> {
  const { result, provider } = await tryProviders(config.aiTranscribeProviders, "transcribe", async (p) => {
    switch (p as TranscribeProvider) {
      case "groq":
        return groqTranscribe(buffer, fileName);
      case "gemini":
        return geminiTranscribe(buffer, fileName);
      case "openai":
        return openaiTranscribe(buffer, fileName);
      default:
        throw new Error(`Unknown transcribe provider: ${p}`);
    }
  });
  return { text: result, provider };
}

export function getAiProviderStatus() {
  return {
    script: config.aiScriptProviders.map((p) => ({ provider: p, configured: providerConfigured(p as ScriptProvider) })),
    tts: config.aiTtsProviders.map((p) => ({ provider: p, configured: providerConfigured(p as TtsProvider) })),
    transcribe: config.aiTranscribeProviders.map((p) => ({
      provider: p,
      configured: providerConfigured(p as TranscribeProvider),
    })),
  };
}
