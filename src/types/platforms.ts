export type SocialPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "linkedin" | "x";

export interface PlatformPublishResult {
  platform: SocialPlatform;
  success: boolean;
  externalId?: string;
  url?: string;
  error?: string;
  publishedAt?: string;
}

export interface PlatformConnection {
  platform: SocialPlatform;
  connected: boolean;
  accountName?: string;
  configured: boolean;
}

export interface ContentFingerprint {
  contentId: string;
  titleHash: string;
  scriptHash: string;
  hookHash: string;
  createdAt: string;
}
