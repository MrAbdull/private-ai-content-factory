import type {
  AutomationJob,
  ContentItem,
  ContentSource,
  PerformanceMetrics,
  TrendOpportunity,
  YouTubeChannel,
} from "@/types";

export interface BlastOperation {
  id: string;
  topic: string;
  requestedCount: number;
  completedCount: number;
  channelIds: string[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
}

export interface FootageUsageRecord {
  id: string;
  contentId: string;
  provider: string;
  footageId: string;
  footageUrl?: string;
  usedAt: string;
}

export interface EvergreenEntry {
  contentId: string;
  channelId: string;
  priority: number;
  addedAt: string;
}

export interface PlatformStore {
  channels: YouTubeChannel[];
  sources: ContentSource[];
  content: ContentItem[];
  metrics: PerformanceMetrics[];
  trends: TrendOpportunity[];
  jobs: AutomationJob[];
  blastOperations: BlastOperation[];
  footageUsage: FootageUsageRecord[];
  evergreen?: EvergreenEntry[];
  version: number;
}
