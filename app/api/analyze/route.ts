import { env } from "cloudflare:workers";

type RoomMaterial = {
  roomName?: string;
  images?: Array<{ id: string; src: string; date?: string; label?: string }>;
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
    text: `ROOM: ${material.roomName ?? "Untitled room"}\nTOTAL MATERIAL: ${images.length} images, ${texts.length} text notes, ${audios.length} voice transcripts. Each image below is immediately preceded by its authoritative fragment ID. Never attach an image's content to a different ID.`,
  }];
  for (const image of images) {
    const imageUrl = new URL(image.src, origin).toString();
    content.push({ type: "input_text", text: `IMAGE FRAGMENT ID: ${image.id}\nDATE: ${image.date ?? "Unknown"}\nLABEL: ${image.label ?? "Untitled image"}` });
    content.push({ type: "input_image", image_url: imageUrl, detail: "auto" });
  }
  content.push({
    type: "input_text",
    text: `TEXT AND VOICE FRAGMENTS:\n${JSON.stringify({ texts, audios })}\n\nPREVIOUSLY REJECTED INTERPRETATIONS (do not repeat or lightly rephrase):\n${JSON.stringify(material.rejectedThreads ?? [])}`,
  });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "medium" },
      instructions: "You are Drawer, a restrained creative-memory assistant. Return zero to four Living Threads based only on evidential strength; never fill a quota. First inspect every supplied fragment and develop candidate patterns. Then perform a separate diversity pass: when the room contains eight or more fragments, do not stop after the first valid pattern—actively test whether another independent, well-supported pattern exists. Return fewer only when additional candidates are genuinely weak. Each Thread must be supported by at least two supplied fragments and be meaningfully distinct; merge overlapping interpretations. A shared color or object alone is too shallow unless language, time, composition, or creative intent gives it a defensible meaning. Treat interpretations as hypotheses, never diagnoses. Every image is paired with the IMAGE FRAGMENT ID immediately before it; cite only that exact ID for that image and never transfer visual content between IDs. Cite concrete visual, linguistic, and temporal evidence. Do not repeat or lightly rephrase rejected interpretations. Write concise, evocative English. If no defensible pattern exists, return an empty threads array.",
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "drawer_living_threads", strict: true, schema: threadSchema } },
      max_output_tokens: 3200,
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
    const parsed = JSON.parse(outputText) as { threads?: Array<Record<string, unknown>> };
    if (!Array.isArray(parsed.threads)) throw new Error("Missing threads array");
    const allowedIds = new Set([
      ...images.map((item) => item.id),
      ...texts.map((item) => item.id),
      ...audios.map((item) => item.id),
    ]);
    const threads = parsed.threads.flatMap((thread, index) => {
      const fragmentIds = Array.from(new Set(
        (Array.isArray(thread.fragmentIds) ? thread.fragmentIds : [])
          .filter((id): id is string => typeof id === "string" && allowedIds.has(id)),
      ));
      if (fragmentIds.length < 2) return [];
      const title = typeof thread.title === "string" ? thread.title : `Living Thread ${index + 1}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "thread";
      return [{
        ...thread,
        id: `${slug}-${index + 1}`,
        title,
        fragmentIds,
      }];
    });
    return Response.json({ threads });
  } catch {
    return Response.json({ error: "Drawer received an incomplete analysis" }, { status: 502 });
  }
}
