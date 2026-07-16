import { env } from "cloudflare:workers";

const MAX_AUDIO_BYTES = 15_000_000;

export async function POST(request: Request) {
  if (!env.OPENAI_API_KEY) return Response.json({ error: "AI is not configured yet" }, { status: 503 });

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) return Response.json({ error: "An audio recording is required" }, { status: 400 });
  if (!audio.type.startsWith("audio/") || audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Unsupported or oversized recording" }, { status: 415 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "voice-note.webm");
  upstream.append("model", "gpt-4o-mini-transcribe");
  upstream.append("response_format", "json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: upstream,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Transcription failed", response.status, detail.slice(0, 500));
    return Response.json({ error: "The voice note could not be transcribed" }, { status: 502 });
  }

  const result = await response.json<{ text?: string }>();
  return Response.json({ transcript: result.text?.trim() ?? "" });
}
