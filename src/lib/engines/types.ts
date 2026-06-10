import type {
  BlastRequest,
  ContentItem,
  ContentSource,
  ContentStyle,
  PerformanceMetrics,
  TrendOpportunity,
  VideoVersion,
  YouTubeChannel,
} from "@/types";

export interface ProductionContext {
  channel: YouTubeChannel;
  source?: ContentSource;
  topic: string;
  historicalPerformance?: PerformanceMetrics[];
  availableResources: string[];
}

export interface ProductionPlan {
  style: ContentStyle;
  durationSeconds: number;
  hooks: string[];
  scriptOutline: string[];
  footageStrategy: string;
  narrationStyle: string;
  captionFormat: string;
  publishingSlot?: string;
}

export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
}

export interface ContentBlastResult {
  operationId: string;
  topic: string;
  requestedCount: number;
  contentIds: string[];
  estimatedCompletionMinutes: number;
}

export interface RepurposeResult {
  sourceId: string;
  opportunities: { angle: string; hook: string; audience: string }[];
  contentIds: string[];
}

export interface SafetyCheckResult {
  passed: boolean;
  checks: { type: string; passed: boolean; message: string }[];
}

export interface VersionScore {
  version: VideoVersion;
  retentionScore: number;
  engagementScore: number;
  hookScore: number;
  overallScore: number;
}

export interface TrendScanResult {
  opportunities: TrendOpportunity[];
  scannedSources: string[];
}

export interface ResourceRouteDecision {
  task: string;
  selectedProvider: string;
  reason: string;
  fallbackProviders: string[];
}

export type { BlastRequest, ContentItem };
