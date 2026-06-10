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

const BASE = "https://api.groq.com/openai/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function chatJson(system: string, user: string): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: config.groqModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ProviderError(`Groq ${res.status}: ${body.slice(0, 200)}`, "groq", res.status, res.status === 429 || res.status === 503);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new ProviderError("Groq returned empty content", "groq");
  return content;
}

export async function groqGenerateScript(req: ScriptRequest): Promise<GeneratedScript> {
  const content = await chatJson(
    buildScriptSystemPrompt(req.channel, req.durationSeconds),
    `Topic: ${req.topic}`
  );
  return normalizeScript(parseJsonFromModel<GeneratedScript>(content), req.topic);
}

export async function groqGenerateFromSource(req: SourceScriptRequest): Promise<GeneratedScript> {
  const topic = req.angle ?? req.sourceText.slice(0, 80);
  const content = await chatJson(
    buildSourceSystemPrompt(req.channel),
    `Source:\n${req.sourceText.slice(0, 2000)}\n\nAngle: ${topic}`
  );
  return normalizeScript(parseJsonFromModel<GeneratedScript>(content), topic);
}

export async function groqTranscribe(buffer: Buffer, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), fileName);
  form.append("model", config.groqWhisperModel);
  form.append("response_format", "text");

  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    throw new ProviderError(`Groq Whisper ${res.status}`, "groq", res.status, res.status === 429 || res.status === 503);
  }

  return (await res.text()).slice(0, 50000);
}
