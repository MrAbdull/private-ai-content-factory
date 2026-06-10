/**
 * Cloudflare Worker — triggers the content factory cron endpoint on a schedule.
 * Deploy: npx wrangler deploy (set CRON_SECRET and APP_URL as secrets)
 */
export interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const url = `${env.APP_URL.replace(/\/$/, "")}/api/cron/process`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET },
    });
    if (!res.ok) {
      console.error("Cron failed:", res.status, await res.text());
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "POST" && new URL(request.url).pathname === "/trigger") {
      const url = `${env.APP_URL.replace(/\/$/, "")}/api/cron/process`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-cron-secret": env.CRON_SECRET },
      });
      return new Response(await res.text(), { status: res.status });
    }
    return new Response("Private AI Content Factory cron worker", { status: 200 });
  },
};
