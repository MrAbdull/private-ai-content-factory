import { NextResponse } from "next/server";
import { z } from "zod";
import { getSources, saveSource } from "@/lib/store/database";
import { generateId } from "@/lib/store/local-store";
import { parseSourceInput } from "@/lib/ingestion/parsers";
import { transcribeAudio, isAudioFile } from "@/lib/ai/transcribe";
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
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const title = form.get("title") as string | null;
      const file = form.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isAudio = isAudioFile(file.name, file.type);

      let sourceType: SourceType = "uploaded_file";
      let result;

      if (isPdf) {
        sourceType = "pdf";
        result = await parseSourceInput("pdf", "", file.name, buffer);
      } else if (isAudio) {
        sourceType = "podcast";
        const transcript = await transcribeAudio(buffer, file.name);
        result = { title: file.name, rawContent: transcript, metadata: { transcribed: true } };
      } else {
        const textFallback = buffer.toString("utf-8").slice(0, 50000);
        result = await parseSourceInput("uploaded_file", textFallback, file.name, buffer);
      }
      const source = await saveSource({
        id: generateId("src"),
        type: sourceType,
        title: title ?? result.title,
        rawContent: result.rawContent,
        metadata: { ...result.metadata, fileName: file.name, fileSize: file.size },
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: source });
    }

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
