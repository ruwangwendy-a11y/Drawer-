import { env } from "cloudflare:workers";

const DEVICE_PATTERN = /^[a-zA-Z0-9-]{16,80}$/;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"]);

export async function POST(request: Request) {
  const deviceId = request.headers.get("x-drawer-device") ?? "";
  if (!DEVICE_PATTERN.test(deviceId)) return Response.json({ error: "Missing device identity" }, { status: 400 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "A file is required" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size > 15_000_000) return Response.json({ error: "Unsupported or oversized file" }, { status: 415 });
  const key = crypto.randomUUID();
  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { deviceId, originalName: file.name.slice(0, 180) },
  });
  return Response.json({ src: `/api/assets/${key}` }, { status: 201 });
}
