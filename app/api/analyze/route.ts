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
        required: ["id", "title", "dimensions", "stage", "observedPattern", "possibleInterpretation", "evidence", "timeEvidence", "spark"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          dimensions: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string", enum: ["motif", "form", "material", "space", "gesture", "atmosphere", "narrative", "process", "time"] },
          },
          stage: { type: "string", enum: ["seed", "emerging", "recurring"] },
          observedPattern: { type: "string" },
          possibleInterpretation: { type: "string" },
          evidence: {
            type: "array",
            minItems: 2,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["fragmentId", "modality", "observation"],
              properties: {
                fragmentId: { type: "string" },
                modality: { type: "string", enum: ["image", "text", "audio"] },
                observation: { type: "string" },
              },
            },
          },
          timeEvidence: { type: "string" },
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
      instructions: `You are Drawer, a careful curator of an evolving creative memory. Your job is to surface recurring visual language without replacing the creator's interpretation.

CORE METHOD
- Be visual-first and language-enriched. Images alone are sufficient evidence. Never penalize a creator for having no text or voice notes; use language only when it adds personal context.
- A fragment may support multiple Threads. Categories are non-exclusive: the same image may belong to an object motif, a compositional habit, and a material study.
- Search across these dimensions: motif/object; form (color, light, composition, scale); material/texture; spatial relationship; gesture/action; atmosphere; narrative/concept; process/medium; temporal development.
- First inspect every fragment and generate candidates across different dimensions. Then make a separate diversity pass. Return zero to four Threads based on strength, never a quota and never stop merely because one valid Thread was found.

EVIDENCE AND INTERPRETATION
- Every Thread needs at least two distinct supplied fragment IDs. Cite the exact authoritative ID and a concrete, visible or quoted observation for every evidence item.
- observedPattern states only what the archive supports. It may confidently name a repeated object, palette, framing choice, surface, gesture, or spatial relationship.
- possibleInterpretation is a restrained creative hypothesis. Leave it as an empty string when the archive does not support meaning. Never diagnose personality, emotion, trauma, or intent.
- A repeated object or color can be a valid Thread on its own when the recurrence is specific and useful. Do not force symbolism. Good: "Circular mirrors recur near the frame edge in four images." Bad: "Circles reveal the creator's fear of completion."
- Language can deepen a visual observation, but it is not required to validate it.
- Do not repeat or lightly rephrase rejected interpretations.

GROWTH STAGE
- seed: an early signal supported by 2 fragments, usually from one moment or batch.
- emerging: supported by 3+ fragments or appearing across at least 2 dates/batches.
- recurring: supported by 5+ fragments across at least 3 distinct dates, periods, or creative batches.
- timeEvidence should explain why that stage was assigned without pretending a longer history than supplied.

OUTPUT
- Threads must be meaningfully distinct, though their evidence may overlap.
- Write concise, precise, evocative English. The spark should retrieve a new way into the creator's own material, not generate an unrelated idea.
- If no defensible recurrence exists, return an empty threads array.`,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "drawer_living_threads", strict: true, schema: threadSchema } },
      max_output_tokens: 4000,
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
    const modalityById = new Map<string, "image" | "text" | "audio">([
      ...images.map((item) => [item.id, "image"] as const),
      ...texts.map((item) => [item.id, "text"] as const),
      ...audios.map((item) => [item.id, "audio"] as const),
    ]);
    const threads = parsed.threads.flatMap((thread, index) => {
      const evidence = (Array.isArray(thread.evidence) ? thread.evidence : []).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Record<string, unknown>;
        const fragmentId = typeof entry.fragmentId === "string" ? entry.fragmentId : "";
        const observation = typeof entry.observation === "string" ? entry.observation.trim() : "";
        if (!allowedIds.has(fragmentId) || !observation) return [];
        return [{ fragmentId, modality: modalityById.get(fragmentId) ?? "image", observation }];
      });
      const fragmentIds = Array.from(new Set(evidence.map((item) => item.fragmentId)));
      if (fragmentIds.length < 2) return [];
      const title = typeof thread.title === "string" ? thread.title : `Living Thread ${index + 1}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "thread";
      return [{
        ...thread,
        id: `${slug}-${index + 1}`,
        title,
        evidence,
        fragmentIds,
      }];
    });
    return Response.json({ threads });
  } catch {
    return Response.json({ error: "Drawer received an incomplete analysis" }, { status: 502 });
  }
}
