import { channelPersonalityEngine } from "@/lib/engines/channel-personality";
import type {
  AutomationJob,
  ContentItem,
  PerformanceMetrics,
  SystemHealth,
  TrendOpportunity,
  YouTubeChannel,
} from "@/types";

const defaultPersonality = (style: YouTubeChannel["contentStyle"]) =>
  channelPersonalityEngine.buildPersonality(style);

export const mockChannels: YouTubeChannel[] = [
  {
    id: "ch-1",
    name: "Career Catalyst",
    youtubeChannelId: "UC_career_001",
    thumbnailUrl: undefined,
    subscriberCount: 12400,
    shortsPerDay: 3,
    publishingMode: "semi_automatic",
    contentStyle: "educational",
    personality: defaultPersonality("educational"),
    isActive: true,
    connectedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "ch-2",
    name: "Growth Hacks Daily",
    youtubeChannelId: "UC_growth_002",
    subscriberCount: 45200,
    shortsPerDay: 5,
    publishingMode: "fully_automatic",
    contentStyle: "viral_social",
    personality: defaultPersonality("viral_social"),
    isActive: true,
    connectedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "ch-3",
    name: "Business Brief",
    youtubeChannelId: "UC_business_003",
    subscriberCount: 8900,
    shortsPerDay: 2,
    publishingMode: "manual",
    contentStyle: "business_explainer",
    personality: defaultPersonality("business_explainer"),
    isActive: true,
    connectedAt: "2025-03-10T10:00:00Z",
  },
];

export const mockContent: ContentItem[] = [
  {
    id: "cnt-1",
    channelId: "ch-1",
    title: "Teacher Interview Tips That Actually Work",
    description: "Ace your next teaching interview with these proven strategies.",
    hashtags: ["#shorts", "#teaching", "#interviewtips"],
    script: "Hook: Stop making this interview mistake...\nTip 1: Research the school culture\nTip 2: Prepare your portfolio stories",
    hook: "Stop making this interview mistake",
    status: "scheduled",
    durationSeconds: 28,
    style: "educational",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    versions: [],
    thumbnails: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt-2",
    channelId: "ch-2",
    title: "AI Side Hustle Nobody Talks About",
    description: "Generate income with AI tools in 2025.",
    hashtags: ["#shorts", "#ai", "#sidehustle"],
    script: "This AI side hustle changed everything...",
    hook: "This AI side hustle changed everything",
    status: "published",
    durationSeconds: 22,
    style: "viral_social",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    youtubeVideoId: "dQw4w9WgXcQ",
    versions: [],
    thumbnails: [],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "cnt-3",
    channelId: "ch-3",
    title: "3 Business Growth Hacks for 2025",
    description: "Scale your business with these strategies.",
    hashtags: ["#shorts", "#business", "#growth"],
    script: "Growth hack #1: Customer retention loops...",
    hook: "Growth hack #1 will surprise you",
    status: "review",
    durationSeconds: 30,
    style: "business_explainer",
    versions: [],
    thumbnails: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt-4",
    channelId: "ch-1",
    title: "Classroom Management in 20 Seconds",
    description: "Quick tip for new teachers.",
    hashtags: ["#shorts", "#teaching"],
    script: "The one classroom rule that changes everything...",
    hook: "The one classroom rule",
    status: "draft",
    durationSeconds: 20,
    style: "educational",
    versions: [],
    thumbnails: [],
    createdAt: new Date().toISOString(),
  },
];

export const mockMetrics: PerformanceMetrics[] = [
  { contentId: "cnt-2", views: 45200, watchTimeSeconds: 890000, retentionRate: 0.68, clickThroughRate: 0.082, subscribersGained: 340, likes: 2100, comments: 89, shares: 156, recordedAt: new Date().toISOString() },
  { contentId: "cnt-1", views: 0, watchTimeSeconds: 0, retentionRate: 0, clickThroughRate: 0, subscribersGained: 0, likes: 0, comments: 0, shares: 0, recordedAt: new Date().toISOString() },
];

export const mockTrends: TrendOpportunity[] = [
  { id: "t1", topic: "AI side hustles 2025", source: "google_trends", score: 92, suggestedAngles: ["Beginner guide", "Tools comparison", "Income proof"], detectedAt: new Date().toISOString() },
  { id: "t2", topic: "Teacher interview tips", source: "youtube_trending", score: 87, suggestedAngles: ["Common mistakes", "Salary negotiation", "Portfolio tips"], detectedAt: new Date().toISOString() },
  { id: "t3", topic: "Business growth hacks", source: "reddit", score: 84, suggestedAngles: ["Bootstrapped growth", "B2B strategies", "Retention loops"], detectedAt: new Date().toISOString() },
];

export const mockJobs: AutomationJob[] = [
  { id: "job-1", type: "video_render", provider: "github_actions", status: "running", payload: { contentId: "cnt-4" }, createdAt: new Date().toISOString() },
  { id: "job-2", type: "schedule_publish", provider: "cloudflare_workers", status: "completed", payload: { contentId: "cnt-1" }, createdAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date().toISOString() },
  { id: "job-3", type: "safety_check", provider: "supabase", status: "completed", payload: { contentId: "cnt-3" }, createdAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7000000).toISOString() },
];

export const mockSystemHealth: SystemHealth = {
  automation: [
    { provider: "github_actions", quotaUsed: 1200, quotaLimit: 2000, health: "healthy", lastChecked: new Date().toISOString() },
    { provider: "cloudflare_workers", quotaUsed: 80000, quotaLimit: 100000, health: "healthy", lastChecked: new Date().toISOString() },
    { provider: "vercel", quotaUsed: 90, quotaLimit: 100, health: "degraded", lastChecked: new Date().toISOString() },
  ],
  footage: [
    { provider: "pexels", quotaUsed: 450, quotaLimit: 1000, health: "healthy", lastChecked: new Date().toISOString() },
    { provider: "pixabay", quotaUsed: 320, quotaLimit: 800, health: "healthy", lastChecked: new Date().toISOString() },
  ],
  queueDepth: 12,
  activeJobs: 3,
  failedJobs24h: 1,
};
