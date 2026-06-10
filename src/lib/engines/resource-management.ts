import { getResourceUsage, saveResourceUsage } from "@/lib/store/local-database";
import type { AutomationProvider, ResourceUsage } from "@/types";
import type { EngineResult, ResourceRouteDecision } from "./types";

interface ProviderState {
  provider: AutomationProvider;
  quotaUsed: number;
  quotaLimit: number;
  health: "healthy" | "degraded" | "unavailable";
  avgLatencyMs: number;
  failureRate: number;
}

/**
 * AI Resource Management Engine — routes workloads across free-tier services.
 */
export class ResourceManagementEngine {
  private providers: ProviderState[] = [
    { provider: "github_actions", quotaUsed: 1200, quotaLimit: 2000, health: "healthy", avgLatencyMs: 450, failureRate: 0.02 },
    { provider: "cloudflare_workers", quotaUsed: 80000, quotaLimit: 100000, health: "healthy", avgLatencyMs: 50, failureRate: 0.01 },
    { provider: "cloudflare_r2", quotaUsed: 8, quotaLimit: 10, health: "healthy", avgLatencyMs: 120, failureRate: 0.005 },
    { provider: "supabase", quotaUsed: 450, quotaLimit: 500, health: "healthy", avgLatencyMs: 80, failureRate: 0.015 },
    { provider: "vercel", quotaUsed: 90, quotaLimit: 100, health: "degraded", avgLatencyMs: 200, failureRate: 0.05 },
    { provider: "local", quotaUsed: 0, quotaLimit: 999999, health: "healthy", avgLatencyMs: 30, failureRate: 0 },
  ];

  private taskProviderMap: Record<string, AutomationProvider[]> = {
    video_render: ["github_actions", "local"],
    storage_upload: ["cloudflare_r2", "supabase"],
    api_webhook: ["cloudflare_workers", "vercel"],
    db_operation: ["supabase"],
    scheduled_publish: ["github_actions", "cloudflare_workers"],
  };

  routeTask(task: string): EngineResult<ResourceRouteDecision> {
    const candidates = this.taskProviderMap[task] ?? ["local"];
    const available = this.providers
      .filter((p) => candidates.includes(p.provider))
      .filter((p) => p.health !== "unavailable")
      .filter((p) => p.quotaUsed < p.quotaLimit * 0.95)
      .sort((a, b) => this.scoreProvider(a) - this.scoreProvider(b));

    const selected = available[0];
    if (!selected) {
      return { success: false, error: "No available providers for task" };
    }

    return {
      success: true,
      data: {
        task,
        selectedProvider: selected.provider,
        reason: `Best score: health=${selected.health}, quota=${((selected.quotaUsed / selected.quotaLimit) * 100).toFixed(0)}%`,
        fallbackProviders: available.slice(1).map((p) => p.provider),
      },
      provider: "resource_management",
    };
  }

  getUsageSnapshot(): ResourceUsage[] {
    return this.providers.map((p) => ({
      provider: p.provider,
      quotaUsed: p.quotaUsed,
      quotaLimit: p.quotaLimit,
      health: p.health,
      lastChecked: new Date().toISOString(),
    }));
  }

  async loadPersistedUsage(): Promise<void> {
    const stored = await getResourceUsage();
    if (!stored.length) return;
    for (const s of stored) {
      const p = this.providers.find((x) => x.provider === s.provider);
      if (p) {
        p.quotaUsed = s.quotaUsed;
        p.quotaLimit = s.quotaLimit;
        p.health = s.health;
      }
    }
  }

  async persistUsage(): Promise<void> {
    await saveResourceUsage(this.getUsageSnapshot());
  }

  recordUsage(task: string, success: boolean) {
    const route = this.routeTask(task);
    if (route.data?.selectedProvider) {
      const p = this.providers.find((x) => x.provider === route.data!.selectedProvider);
      if (p) {
        p.quotaUsed += 1;
        if (!success) this.recordFailure(p.provider);
      }
    }
    void this.persistUsage();
  }

  recordFailure(provider: AutomationProvider) {
    const p = this.providers.find((x) => x.provider === provider);
    if (p) {
      p.failureRate = Math.min(1, p.failureRate + 0.1);
      if (p.failureRate > 0.2) p.health = "degraded";
      if (p.failureRate > 0.5) p.health = "unavailable";
    }
  }

  private scoreProvider(p: ProviderState): number {
    const quotaRatio = p.quotaUsed / p.quotaLimit;
    const healthPenalty = p.health === "degraded" ? 0.3 : p.health === "unavailable" ? 1 : 0;
    return quotaRatio * 0.4 + p.failureRate * 0.3 + (p.avgLatencyMs / 1000) * 0.2 + healthPenalty;
  }
}

export const resourceManagementEngine = new ResourceManagementEngine();
