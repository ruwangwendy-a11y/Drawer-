import { env } from "cloudflare:workers";

type RoomMaterial = {
  roomName?: string;
  images?: Array<{ id: string; src: string; date?: string }>;
  texts?: Array<{ id: string; text: string; date?: string }>;
  audios?: Array<{ id: string; transcript?: string; date?: string }>;
  rejectedThreads?: Array<{ title: string; summary: string }>;
};

const threadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["threads"],
  properties: {
    threads: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "summary", "visualEvidence", "languageEvidence", "timeEvidence", "fragmentIds", "spark"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          visualEvidence: { type: "array", items: { type: "string" }, maxItems: 3 },
          languageEvidence: { type: "array", items: { type: "string" }, maxItems: 3 },
          timeEvidence: { type: "string" },
          fragmentIds: { type: "array", items: { type: "string" }, minItems: 2 },
          spark: { type: "string" },
        },
      },
    },
  },
};

export async function POST(request: Request) {
  if (!env.OPENAI_API_KEY) return Response.json({ error: "AI is not configured yet" }, { status: 503 });

  const material = await request.json<RoomMaterial>();
  // A Room can contain a full working set. The previous 12-image cap meant
  // later additions—often the most important new material—never reached the
  // analysis at all.
  const images = (material.images ?? []).slice(0, 24);
  const texts = (material.texts ?? []).slice(0, 30);
  const audios = (material.audios ?? []).slice(0, 20);
  if (images.length + texts.length + audios.length < 2) {
    return Response.json({ error: "Add at least two fragments before looking for a thread" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const content: Array<Record<string, unknown>> = [{
    type: "input_text",
    text: JSON.stringify({ roomName: material.roomName ?? "Untitled room", images, texts, audios, rejectedThreads: material.rejectedThreads ?? [] }),
  }];
  for (const image of images) {
    const imageUrl = new URL(image.src, origin).toString();
    content.push({ type: "input_image", image_url: imageUrl, detail: "low" });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      instructions: "You are Drawer, a restrained creative-memory assistant. Return between zero and four Living Threads based only on evidential strength—never aim for a fixed count and never fill a quota. Find only recurring patterns supported by at least two supplied fragments. Each Thread must be meaningfully distinct; merge overlapping interpretations and prefer fewer strong Threads over several variations of the same idea. Treat interpretations as hypotheses, never diagnoses or authoritative claims. Cite concrete visual, linguistic, and temporal evidence. Use the supplied fragment ids exactly. Do not repeat or lightly rephrase any rejectedThreads; look for a genuinely different connection. Write concise, evocative English. If no defensible pattern exists, return an empty threads array.",
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "drawer_living_threads", strict: true, schema: threadSchema } },
      max_output_tokens: 2400,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Room analysis failed", response.status, detail.slice(0, 800));
    return Response.json({ error: "Drawer could not analyze this room yet" }, { status: 502 });
  }

  const result = await response.json<{
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  }>();
  const outputText = result.output_text
    ?? result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text
    ?? "";
  try {
    const parsed = JSON.parse(outputText) as { threads?: unknown[] };
    if (!Array.isArray(parsed.threads)) throw new Error("Missing threads array");
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Drawer received an incomplete analysis" }, { status: 502 });
  }
}
