import { NextResponse } from "next/server";
import { z } from "zod";
import { getSources, saveSource } from "@/lib/store/database";
import { generateId } from "@/lib/store/local-store";
import { parseSourceInput } from "@/lib/ingestion/parsers";
import type { SourceType } from "@/types";

const sourceSchema = z.object({
  type: z.string(),
  input: z.string().min(1),
  title: z.string().optional(),
  fileName: z.string().optional(),
});

export async function GET() {
  const sources = await getSources();
  return NextResponse.json({ success: true, data: sources });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sourceSchema.parse(body);
    const result = await parseSourceInput(
      parsed.type as SourceType,
      parsed.input,
      parsed.fileName
    );

    const source = await saveSource({
      id: generateId("src"),
      type: parsed.type as SourceType,
      title: parsed.title ?? result.title,
      rawContent: result.rawContent,
      metadata: result.metadata,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: source });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Parse failed" },
      { status: 400 }
    );
  }
}
