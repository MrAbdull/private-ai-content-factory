function parseProviderList(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  dataDir: process.env.DATA_DIR ?? ".data",
  cronSecret: process.env.CRON_SECRET ?? "dev-cron-secret",
  singleUserId: process.env.SINGLE_USER_ID ?? "00000000-0000-0000-0000-000000000001",
  hasSupabase: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  useSupabaseStore: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ),
  hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
  hasGroq: Boolean(process.env.GROQ_API_KEY),
  hasGemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
  hasEdgeTts: true,
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  groqWhisperModel: process.env.GROQ_WHISPER_MODEL ?? "whisper-large-v3",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  edgeTtsVoice: process.env.EDGE_TTS_VOICE ?? "en-US-JennyNeural",
  aiScriptProviders: parseProviderList(process.env.AI_SCRIPT_PROVIDERS, "groq,gemini,openai"),
  aiTtsProviders: parseProviderList(process.env.AI_TTS_PROVIDERS, "edge,openai"),
  aiTranscribeProviders: parseProviderList(process.env.AI_TRANSCRIBE_PROVIDERS, "groq,gemini,openai"),
  hasYouTube: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
  hasPexels: Boolean(process.env.PEXELS_API_KEY),
  hasPixabay: Boolean(process.env.PIXABAY_API_KEY),
  hasR2: Boolean(
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET
  ),
  hasTikTok: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_ACCESS_TOKEN),
  hasMeta: Boolean(process.env.META_APP_ID && process.env.META_ACCESS_TOKEN),
  hasLinkedIn: Boolean(process.env.LINKEDIN_ACCESS_TOKEN),
  hasX: Boolean(process.env.X_API_BEARER_TOKEN),
  hasGoogleDrive: Boolean(process.env.GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  ttsVoice: process.env.TTS_VOICE ?? "alloy",
  defaultCrossPost: (process.env.DEFAULT_CROSS_POST_PLATFORMS ?? "youtube").split(",").map((s) => s.trim()),
};
