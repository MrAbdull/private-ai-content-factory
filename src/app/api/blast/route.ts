import { NextResponse } from "next/server";
import { contentBlastEngine } from "@/lib/engines/content-blast";
import { mockChannels } from "@/lib/mock-data";
import { z } from "zod";

const blastSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().int().min(1).max(500),
  channelIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = blastSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const result = await contentBlastEngine.blast(parsed.data, mockChannels);

    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        operationId: result.data.operationId,
        contentIds: result.data.contentIds,
        estimatedMinutes: result.data.estimatedCompletionMinutes,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
