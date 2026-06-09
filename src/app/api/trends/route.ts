import { NextResponse } from "next/server";
import { getTrends, saveTrends } from "@/lib/store/database";
import { trendDiscoveryEngine } from "@/lib/engines/trend-discovery";

export async function GET() {
  let trends = await getTrends();
  if (trends.length === 0) {
    const scan = await trendDiscoveryEngine.scan();
    if (scan.data?.opportunities) {
      await saveTrends(scan.data.opportunities);
      trends = scan.data.opportunities;
    }
  }
  return NextResponse.json({ success: true, data: trends });
}
