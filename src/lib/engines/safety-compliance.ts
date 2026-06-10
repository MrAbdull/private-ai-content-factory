import { checkCopyright } from "@/lib/engines/copyright";
import { getContent } from "@/lib/store/database";
import type { ContentItem } from "@/types";
import type { EngineResult, SafetyCheckResult } from "./types";

const DEFAULT_PROFANITY = [
  "spam", "scam", "fake", "guaranteed riches", "get rich quick",
  "nude", "porn", "xxx", "casino hack",
];

function getProfanityList(): string[] {
  const extra = process.env.PROFANITY_BLOCKLIST?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [...DEFAULT_PROFANITY, ...(extra ?? [])];
}

export class SafetyComplianceEngine {
  async validate(content: ContentItem): Promise<EngineResult<SafetyCheckResult>> {
    const checks = await Promise.all([
      this.checkCopyrightFingerprint(content),
      this.checkDuplicate(content),
      this.checkMetadata(content),
      this.checkProfanity(content),
      this.checkCompliance(content),
      this.checkHashtags(content),
    ]);

    const passed = checks.every((c) => c.passed);
    return { success: true, data: { passed, checks }, provider: "safety_compliance" };
  }

  private async checkCopyrightFingerprint(content: ContentItem) {
    const fp = await checkCopyright(content);
    const licensed = !content.videoUrl?.includes("unlicensed");
    const passed = fp.passed && licensed;
    return {
      type: "copyright",
      passed,
      message: !fp.passed
        ? `Duplicate fingerprint — similar to content ${fp.duplicateOf}`
        : licensed
          ? "Unique content fingerprint · licensed footage"
          : "Unlicensed source flagged",
    };
  }

  private async checkDuplicate(content: ContentItem) {
    const existing = await getContent();
    const dup = existing.find(
      (c) => c.id !== content.id && c.title.toLowerCase().trim() === content.title.toLowerCase().trim()
    );
    const hookDup = existing.find(
      (c) => c.id !== content.id && c.hook && content.hook && c.hook.toLowerCase() === content.hook.toLowerCase()
    );
    const isDuplicate = Boolean(dup || hookDup);
    return {
      type: "duplicate",
      passed: !isDuplicate,
      message: isDuplicate ? `Similar to: ${(dup ?? hookDup)?.title}` : "Content is unique",
    };
  }

  private checkMetadata(content: ContentItem) {
    const titleOk = content.title.length > 0 && content.title.length <= 100;
    const descOk = content.description.length <= 5000;
    const hashtagOk = content.hashtags.length <= 15;
    const valid = titleOk && descOk && hashtagOk;
    return {
      type: "metadata",
      passed: valid,
      message: valid ? "Metadata valid" : "Title, description, or hashtag count out of range",
    };
  }

  private checkProfanity(content: ContentItem) {
    const text = `${content.title} ${content.script} ${content.description}`.toLowerCase();
    const found = getProfanityList().filter((w) => text.includes(w));
    return {
      type: "profanity",
      passed: found.length === 0,
      message: found.length ? `Flagged: ${found.join(", ")}` : "Clean",
    };
  }

  private checkCompliance(content: ContentItem) {
    const withinDuration = content.durationSeconds >= 15 && content.durationSeconds <= 60;
    const hasHook = content.hook.length > 5;
    return {
      type: "platform_compliance",
      passed: withinDuration && hasHook,
      message: withinDuration && hasHook ? "YouTube Shorts compliant" : "Duration or hook issue",
    };
  }

  private checkHashtags(content: ContentItem) {
    const banned = ["#spam", "#follow4follow", "#sub4sub"];
    const found = content.hashtags.filter((h) => banned.includes(h.toLowerCase()));
    return {
      type: "hashtag_policy",
      passed: found.length === 0,
      message: found.length ? `Banned hashtags: ${found.join(", ")}` : "Hashtags OK",
    };
  }
}

export const safetyComplianceEngine = new SafetyComplianceEngine();
