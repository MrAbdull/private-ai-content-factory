export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  dataDir: process.env.DATA_DIR ?? ".data",
  cronSecret: process.env.CRON_SECRET ?? "dev-cron-secret",
  hasSupabase: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
  hasYouTube: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
  hasPexels: Boolean(process.env.PEXELS_API_KEY),
  hasPixabay: Boolean(process.env.PIXABAY_API_KEY),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};
