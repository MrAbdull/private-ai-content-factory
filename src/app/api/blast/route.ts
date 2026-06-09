import { NextResponse } from "next/server";
import { z } from "zod";
import { getChannels, saveBlastOperation } from "@/lib/store/database";
import { generateId } from "@/lib/store/local-store";
import { createShortFromTopic } from "@/lib/pipeline/content-pipeline";

const blastSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().int().min(1).max(100),
  channelIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = blastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const channels = await getChannels();
    const targetChannels = channels.filter((c) => parsed.data.channelIds.includes(c.id));
    if (targetChannels.length === 0) {
      return NextResponse.json({ success: false, error: "No valid channels" }, { status: 400 });
    }

    const operationId = generateId("op");
    const ideasPerChannel = Math.ceil(parsed.data.count / targetChannels.length);
    const contentIds: string[] = [];

    await saveBlastOperation({
      id: operationId,
      topic: parsed.data.topic,
      requestedCount: parsed.data.count,
      completedCount: 0,
      channelIds: parsed.data.channelIds,
      status: "running",
      createdAt: new Date().toISOString(),
    });

    const angles = [
      parsed.data.topic,
      `Beginner ${parsed.data.topic}`,
      `Advanced ${parsed.data.topic}`,
      `${parsed.data.topic} mistakes`,
      `${parsed.data.topic} hacks`,
      `Why ${parsed.data.topic} matters`,
      `${parsed.data.topic} in 30 seconds`,
      `Secret ${parsed.data.topic} tip`,
    ];

    for (const channel of targetChannels) {
      for (let i = 0; i < ideasPerChannel && contentIds.length < parsed.data.count; i++) {
        const topic = angles[i % angles.length] + (i >= angles.length ? ` #${Math.floor(i / angles.length) + 1}` : "");
        try {
          const item = await createShortFromTopic(topic, channel.id);
          contentIds.push(item.id);
        } catch (e) {
          console.error("Blast item failed:", e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        operationId,
        topic: parsed.data.topic,
        contentIds,
        generated: contentIds.length,
        estimatedMinutes: Math.ceil(contentIds.length * 1.5),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Blast failed" },
      { status: 500 }
    );
  }
}
