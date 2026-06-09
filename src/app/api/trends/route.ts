import { NextResponse } from "next/server";
import { trendDiscoveryEngine } from "@/lib/engines/trend-discovery";

export async function GET() {
  const result = await trendDiscoveryEngine.scan();
  return NextResponse.json(result);
}
