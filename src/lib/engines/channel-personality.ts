import type { ChannelPersonality, ContentStyle, YouTubeChannel } from "@/types";

const STYLE_PERSONALITY_PRESETS: Partial<Record<ContentStyle, Partial<ChannelPersonality>>> = {
  educational: {
    audienceProfile: "Learners seeking quick actionable knowledge",
    writingStyle: "Clear, concise, authoritative",
    vocabulary: ["learn", "discover", "pro tip", "essential"],
    pacing: "medium",
    tone: "helpful",
  },
  viral_social: {
    audienceProfile: "Scroll-stoppers seeking entertainment and quick wins",
    writingStyle: "Punchy, high-energy, curiosity-driven",
    vocabulary: ["wait", "secret", "hack", "insane"],
    pacing: "fast",
    tone: "exciting",
  },
  business_explainer: {
    audienceProfile: "Entrepreneurs and professionals",
    writingStyle: "Professional, data-driven, strategic",
    vocabulary: ["growth", "revenue", "strategy", "scale"],
    pacing: "medium",
    tone: "confident",
  },
};

/**
 * Channel Personality Engine — adapts all content to channel identity.
 */
export class ChannelPersonalityEngine {
  buildPersonality(style: ContentStyle, overrides?: Partial<ChannelPersonality>): ChannelPersonality {
    const preset = STYLE_PERSONALITY_PRESETS[style] ?? {};
    return {
      audienceProfile: overrides?.audienceProfile ?? preset.audienceProfile ?? "General audience",
      writingStyle: overrides?.writingStyle ?? preset.writingStyle ?? "Conversational",
      vocabulary: overrides?.vocabulary ?? preset.vocabulary ?? [],
      brandingRules: overrides?.brandingRules ?? ["Maintain consistent tone", "Use channel keywords"],
      contentPreferences: overrides?.contentPreferences ?? ["High retention hooks", "Clear value delivery"],
      voiceSettings: overrides?.voiceSettings ?? { speed: 1.0, pitch: 1.0 },
      thumbnailStyle: overrides?.thumbnailStyle ?? "Bold text + high contrast",
      postingStrategy: overrides?.postingStrategy ?? "Consistent daily publishing",
      pacing: overrides?.pacing ?? preset.pacing ?? "medium",
      tone: overrides?.tone ?? preset.tone ?? "neutral",
    };
  }

  adaptScript(script: string, channel: YouTubeChannel): string {
    const { personality } = channel;
    const vocabHint = personality.vocabulary.slice(0, 2).join(", ");
    return `[${personality.tone}/${personality.writingStyle}] ${script}\n<!-- Adapted for: ${personality.audienceProfile}. Keywords: ${vocabHint} -->`;
  }

  adaptTitle(title: string, channel: YouTubeChannel): string {
    if (channel.personality.vocabulary.length === 0) return title;
    const keyword = channel.personality.vocabulary[0];
    if (title.toLowerCase().includes(keyword.toLowerCase())) return title;
    return `${title} | ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
  }
}

export const channelPersonalityEngine = new ChannelPersonalityEngine();
