export type PublishingMode = "manual" | "semi_automatic" | "fully_automatic";

export type ContentStyle =
  | "faceless_documentary"
  | "educational"
  | "business_explainer"
  | "storytelling"
  | "news_reporter"
  | "viral_social"
  | "reddit_story"
  | "motivational"
  | "corporate"
  | "minimalist"
  | "custom_brand";

export type SourceType =
  | "text_prompt"
  | "script"
  | "pdf"
  | "url"
  | "blog_post"
  | "article"
  | "youtube_video"
  | "podcast"
  | "transcript"
  | "google_doc"
  | "uploaded_file"
  | "notes"
  | "raw_text";

export type ContentStatus =
  | "draft"
  | "generating"
  | "review"
  | "scheduled"
  | "published"
  | "failed"
  | "archived";

export type FootageProvider = "pexels" | "pixabay";

export type AutomationProvider =
  | "github_actions"
  | "cloudflare_workers"
  | "cloudflare_r2"
  | "supabase"
  | "vercel"
  | "local";

export interface ChannelPersonality {
  audienceProfile: string;
  writingStyle: string;
  vocabulary: string[];
  brandingRules: string[];
  contentPreferences: string[];
  voiceSettings: Record<string, unknown>;
  thumbnailStyle: string;
  postingStrategy: string;
  pacing: "slow" | "medium" | "fast";
  tone: string;
}

export interface YouTubeOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  obtained_at: number;
}

export interface YouTubeChannel {
  id: string;
  name: string;
  youtubeChannelId: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  shortsPerDay: number;
  publishingMode: PublishingMode;
  contentStyle: ContentStyle;
  personality: ChannelPersonality;
  isActive: boolean;
  connectedAt: string;
  oauthTokens?: YouTubeOAuthTokens;
}

export interface ContentSource {
  id: string;
  type: SourceType;
  title: string;
  rawContent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface VideoVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  hook: string;
  script: string;
  narrationStyle: string;
  pacingStrategy: string;
  editingStyle: string;
  captionStyle: string;
  predictedScore: number;
  isSelected: boolean;
  videoUrl?: string;
}

export interface ThumbnailVariant {
  id: string;
  contentId: string;
  headline: string;
  layout: string;
  imageUrl?: string;
  predictedCtr: number;
  isSelected: boolean;
}

export interface ContentItem {
  id: string;
  channelId: string;
  sourceId?: string;
  title: string;
  description: string;
  hashtags: string[];
  script: string;
  hook: string;
  status: ContentStatus;
  durationSeconds: number;
  style: ContentStyle;
  videoUrl?: string;
  thumbnailUrl?: string;
  scheduledAt?: string;
  publishedAt?: string;
  youtubeVideoId?: string;
  versions: VideoVersion[];
  thumbnails: ThumbnailVariant[];
  createdAt: string;
}

export interface PerformanceMetrics {
  contentId: string;
  views: number;
  watchTimeSeconds: number;
  retentionRate: number;
  clickThroughRate: number;
  subscribersGained: number;
  likes: number;
  comments: number;
  shares: number;
  recordedAt: string;
}

export interface TrendOpportunity {
  id: string;
  topic: string;
  source: string;
  score: number;
  suggestedAngles: string[];
  detectedAt: string;
}

export interface ResourceUsage {
  provider: AutomationProvider | FootageProvider;
  quotaUsed: number;
  quotaLimit: number;
  health: "healthy" | "degraded" | "unavailable";
  lastChecked: string;
}

export interface AutomationJob {
  id: string;
  type: string;
  provider: AutomationProvider;
  status: "pending" | "running" | "completed" | "failed" | "retrying";
  payload: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface BlastRequest {
  topic: string;
  count: number;
  channelIds: string[];
  style?: ContentStyle;
}

export interface SystemHealth {
  automation: ResourceUsage[];
  footage: ResourceUsage[];
  queueDepth: number;
  activeJobs: number;
  failedJobs24h: number;
}
