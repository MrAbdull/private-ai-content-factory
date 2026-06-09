import type { ContentStyle } from "@/types";

export interface StyleTemplate {
  bgColor: string;
  hookFontSize: number;
  hookY: string;
  captionMarginV: number;
  captionFontSize: number;
  fadeIn?: boolean;
}

export const STYLE_TEMPLATES: Record<ContentStyle, StyleTemplate> = {
  faceless_documentary: { bgColor: "0x0d0d0d", hookFontSize: 44, hookY: "h-220", captionMarginV: 100, captionFontSize: 20 },
  educational: { bgColor: "0x1a2744", hookFontSize: 48, hookY: "h-200", captionMarginV: 120, captionFontSize: 22 },
  business_explainer: { bgColor: "0x1e2a3a", hookFontSize: 46, hookY: "h-180", captionMarginV: 110, captionFontSize: 21 },
  storytelling: { bgColor: "0x2d1b33", hookFontSize: 42, hookY: "(h-text_h)/2", captionMarginV: 130, captionFontSize: 22 },
  news_reporter: { bgColor: "0x8b0000", hookFontSize: 52, hookY: "120", captionMarginV: 90, captionFontSize: 24 },
  viral_social: { bgColor: "0xff006e", hookFontSize: 56, hookY: "h-250", captionMarginV: 80, captionFontSize: 26 },
  reddit_story: { bgColor: "0x1a1a1a", hookFontSize: 38, hookY: "(h-text_h)/3", captionMarginV: 150, captionFontSize: 28 },
  motivational: { bgColor: "0x2d3436", hookFontSize: 50, hookY: "h/3", captionMarginV: 140, captionFontSize: 24 },
  corporate: { bgColor: "0x2c3e50", hookFontSize: 44, hookY: "h-200", captionMarginV: 115, captionFontSize: 20 },
  minimalist: { bgColor: "0xf5f5f5", hookFontSize: 40, hookY: "(h-text_h)/2", captionMarginV: 160, captionFontSize: 18 },
  custom_brand: { bgColor: "0x6c5ce7", hookFontSize: 46, hookY: "h-200", captionMarginV: 120, captionFontSize: 22 },
};

export function getStyleTemplate(style: ContentStyle): StyleTemplate {
  return STYLE_TEMPLATES[style] ?? STYLE_TEMPLATES.educational;
}

export function captionForceStyle(t: StyleTemplate): string {
  return `FontSize=${t.captionFontSize},PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=${t.captionMarginV}`;
}
