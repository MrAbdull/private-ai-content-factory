import type { ContentStyle, PublishingMode, SourceType } from "@/types";

export const CONTENT_STYLES: { value: ContentStyle; label: string; description: string }[] = [
  { value: "faceless_documentary", label: "Faceless Documentary", description: "Cinematic B-roll with authoritative narration" },
  { value: "educational", label: "Educational", description: "Clear explanations with structured pacing" },
  { value: "business_explainer", label: "Business Explainer", description: "Professional insights for entrepreneurs" },
  { value: "storytelling", label: "Storytelling", description: "Narrative arcs with emotional hooks" },
  { value: "news_reporter", label: "News Reporter", description: "Fast-paced current events delivery" },
  { value: "viral_social", label: "Viral Social", description: "High-energy hooks and rapid cuts" },
  { value: "reddit_story", label: "Reddit Story", description: "Text overlay with dramatic storytelling" },
  { value: "motivational", label: "Motivational", description: "Inspirational pacing and uplifting tone" },
  { value: "corporate", label: "Corporate", description: "Polished brand-aligned messaging" },
  { value: "minimalist", label: "Minimalist", description: "Clean visuals with focused messaging" },
  { value: "custom_brand", label: "Custom Brand", description: "Channel-specific custom rules" },
];

export const PUBLISHING_MODES: { value: PublishingMode; label: string; description: string }[] = [
  { value: "manual", label: "Manual Approval", description: "Every video requires your approval before publishing" },
  { value: "semi_automatic", label: "Semi-Automatic", description: "Batches require approval before publishing" },
  { value: "fully_automatic", label: "Fully Automatic", description: "Content is generated and published without approval" },
];

export const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "text_prompt", label: "Text Prompt" },
  { value: "script", label: "Script" },
  { value: "pdf", label: "PDF" },
  { value: "url", label: "Website URL" },
  { value: "blog_post", label: "Blog Post" },
  { value: "article", label: "Article" },
  { value: "youtube_video", label: "YouTube Video" },
  { value: "podcast", label: "Podcast" },
  { value: "transcript", label: "Transcript" },
  { value: "google_doc", label: "Google Doc" },
  { value: "uploaded_file", label: "Uploaded File" },
  { value: "notes", label: "Notes" },
  { value: "raw_text", label: "Raw Text" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/dashboard/channels", label: "Channels", icon: "Youtube" },
  { href: "/dashboard/platforms", label: "Platforms", icon: "Share2" },
  { href: "/dashboard/blast", label: "Content Blast", icon: "Zap" },
  { href: "/dashboard/sources", label: "Sources", icon: "FileInput" },
  { href: "/dashboard/library", label: "Content Library", icon: "Library" },
  { href: "/dashboard/review", label: "Review Queue", icon: "CheckCircle" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "Calendar" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/dashboard/evergreen", label: "Evergreen", icon: "Archive" },
  { href: "/dashboard/trends", label: "Trends", icon: "TrendingUp" },
  { href: "/dashboard/automation", label: "Automation", icon: "Bot" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
] as const;
