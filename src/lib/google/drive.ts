import { createSign } from "crypto";
import { config } from "@/lib/config";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function extractDocId(urlOrId: string): string | null {
  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/,
  ];
  for (const p of patterns) {
    const m = urlOrId.match(p);
    if (m) return m[1];
  }
  return null;
}

async function getServiceAccountToken(scopes: string[]): Promise<string | null> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(sa.private_key.replace(/\\n/g, "\n"), "base64url");

  const jwt = `${header}.${claim}.${signature}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function fetchGoogleDocContent(urlOrId: string): Promise<{ title: string; text: string }> {
  const docId = extractDocId(urlOrId);
  if (!docId) throw new Error("Invalid Google Doc or Drive URL");

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (config.hasGoogleDrive) {
    const token = await getServiceAccountToken(["https://www.googleapis.com/auth/drive.readonly"]);
    if (token) {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (driveRes.ok) {
        const text = await driveRes.text();
        return { title: "Google Doc", text: text.slice(0, 50000) };
      }
    }

    if (apiKey) {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain&key=${apiKey}`
      );
      if (driveRes.ok) {
        const text = await driveRes.text();
        return { title: "Google Doc", text: text.slice(0, 50000) };
      }
    }
  }

  const res = await fetch(exportUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    throw new Error(
      "Could not export Google Doc — share publicly or set GOOGLE_SERVICE_ACCOUNT_JSON for private docs"
    );
  }

  const text = await res.text();
  return { title: "Google Doc", text: text.slice(0, 50000) };
}
