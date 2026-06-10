import { createHash, createHmac } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

export async function uploadToR2(localPath: string, key: string): Promise<string | null> {
  if (!config.hasR2) return null;

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET!;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const body = await fs.readFile(localPath);
  const contentType = localPath.endsWith(".mp4") ? "video/mp4" : "image/jpeg";
  const url = `${endpoint}/${bucket}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const payloadHash = createHash("sha256").update(body).digest("hex");

  const canonicalHeaders = `host:${accountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n/${bucket}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${createHash("sha256").update(canonicalRequest).digest("hex")}`;

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  const auth = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: auth,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Content-Type": contentType,
      "Content-Length": String(body.length),
    },
    body,
  });

  if (!res.ok) {
    console.error("R2 upload failed:", res.status);
    return null;
  }

  const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  return publicBase ? `${publicBase}/${key}` : `/api/media/${path.basename(localPath)}`;
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}
