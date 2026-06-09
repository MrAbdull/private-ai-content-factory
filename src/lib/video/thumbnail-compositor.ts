import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

export interface ThumbnailInput {
  contentId: string;
  headline: string;
  layout: string;
  accentColor?: string;
}

export async function composeThumbnail(input: ThumbnailInput): Promise<string> {
  const dir = path.join(process.cwd(), config.dataDir, "media");
  await fs.mkdir(dir, { recursive: true });
  const outPath = path.join(dir, `${input.contentId}-composed-${input.layout}.jpg`);

  const width = 1280;
  const height = 720;
  const accent = input.accentColor ?? "#6c5ce7";

  const bg = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: input.layout === "split_screen"
        ? { r: 15, g: 15, b: 35 }
        : { r: 22, g: 33, b: 62 },
    },
  })
    .jpeg()
    .toBuffer();

  const words = input.headline.split(" ");
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

  const svg = `
    <svg width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="12" fill="${accent}"/>
      ${input.layout === "split_screen" ? `<rect x="${width / 2}" y="0" width="${width / 2}" height="${height}" fill="rgba(0,0,0,0.3)"/>` : ""}
      <text x="${input.layout === "text_left" ? 60 : width / 2}" y="${height / 2 - 20}"
        font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white"
        ${input.layout === "text_left" ? "" : 'text-anchor="middle"'}>${escapeXml(line1)}</text>
      ${line2 ? `<text x="${input.layout === "text_left" ? 60 : width / 2}" y="${height / 2 + 50}"
        font-family="Arial, sans-serif" font-size="44" fill="#f1f1f1"
        ${input.layout === "text_left" ? "" : 'text-anchor="middle"'}>${escapeXml(line2)}</text>` : ""}
    </svg>`;

  await sharp(bg)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outPath);

  return outPath;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
