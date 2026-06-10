import { config } from "@/lib/config";
import {
  buildScriptSystemPrompt,
  buildSourceSystemPrompt,
  normalizeScript,
  parseJsonFromModel,
  ProviderError,
  type GeneratedScript,
  type ScriptRequest,
  type SourceScriptRequest,
} from "./types";

function apiKey(): string {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? "";
}

function modelUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${apiKey()}`;
}

async function generateText(system: string, user: string): Promise<string> {
  const res = await fetch(modelUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const retryable = res.status === 429 || res.status === 503 || body.includes("RESOURCE_EXHAUSTED");
    throw new ProviderError(`Gemini ${res.status}: ${body.slice(0, 200)}`, "gemini", res.status, retryable);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderError("Gemini returned empty content", "gemini");
  return text;
}

export async function geminiGenerateScript(req: ScriptRequest): Promise<GeneratedScript> {
  const content = await generateText(
    buildScriptSystemPrompt(req.channel, req.durationSeconds),
    `Topic: ${req.topic}`
  );
  return normalizeScript(parseJsonFromModel<GeneratedScript>(content), req.topic);
}

export async function geminiGenerateFromSource(req: SourceScriptRequest): Promise<GeneratedScript> {
  const topic = req.angle ?? req.sourceText.slice(0, 80);
  const content = await generateText(
    buildSourceSystemPrompt(req.channel),
    `Source:\n${req.sourceText.slice(0, 2000)}\n\nAngle: ${topic}`
  );
  return normalizeScript(parseJsonFromModel<GeneratedScript>(content), topic);
}

function mimeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  return "audio/mpeg";
}

export async function geminiTranscribe(buffer: Buffer, fileName: string): Promise<string> {
  const res = await fetch(modelUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeFromFileName(fileName),
                data: buffer.toString("base64"),
              },
            },
            { text: "Transcribe this audio verbatim. Return only the transcript text." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const retryable = res.status === 429 || res.status === 503 || body.includes("RESOURCE_EXHAUSTED");
    throw new ProviderError(`Gemini transcribe ${res.status}`, "gemini", res.status, retryable);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new ProviderError("Gemini transcribe returned empty", "gemini");
  return text.slice(0, 50000);
}
