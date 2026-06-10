import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTENT_STYLES, PUBLISHING_MODES, SOURCE_TYPES } from "@/lib/constants";
import { Shield, Key, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Platform configuration — single-user private studio"
      />
      <div className="space-y-6 p-4 lg:p-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Integrations</CardTitle>
            <CardDescription>Connect external services (configured via environment variables)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Groq (scripts + Whisper)", env: "GROQ_API_KEY", status: "Free tier — primary AI" },
              { name: "Google Gemini", env: "GEMINI_API_KEY", status: "Free tier — AI backup" },
              { name: "Edge TTS", env: "EDGE_TTS_VOICE", status: "Free voice — no key needed" },
              { name: "OpenAI", env: "OPENAI_API_KEY", status: "Optional paid backup" },
              { name: "YouTube Data API", env: "YOUTUBE_CLIENT_ID", status: "OAuth publishing" },
              { name: "Supabase", env: "NEXT_PUBLIC_SUPABASE_URL", status: "Optional cloud DB" },
              { name: "Pexels", env: "PEXELS_API_KEY", status: "Footage provider" },
              { name: "Pixabay", env: "PIXABAY_API_KEY", status: "Footage provider" },
            ].map((api) => (
              <div key={api.name} className="flex justify-between items-center rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{api.name}</p>
                  <p className="text-xs text-muted-foreground">{api.env}</p>
                </div>
                <Badge variant="outline">{api.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Publishing Modes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PUBLISHING_MODES.map((mode) => (
              <div key={mode.value} className="rounded-lg border border-border p-3">
                <p className="font-medium">{mode.label}</p>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Input Sources</CardTitle>
            <CardDescription>{SOURCE_TYPES.length} source types supported</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TYPES.map((s) => (
                <Badge key={s.value} variant="secondary">{s.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Styles</CardTitle>
            <CardDescription>{CONTENT_STYLES.length} production styles with unique pacing and editing rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {CONTENT_STYLES.map((s) => (
              <div key={s.value} className="text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground"> — {s.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Platform Notice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>This is a private single-user content studio. There is no billing, subscriptions, multi-tenancy, or public registration.</p>
            <p>Future platform integrations: TikTok, Instagram Reels, Facebook Reels, X, LinkedIn.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
