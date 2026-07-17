import { env } from "cloudflare:workers";

type SparkRequest = {
  title?: string;
  observedPattern?: string;
  possibleInterpretation?: string;
  previousSpark?: string;
};

const sparkSchema = {
  type: "object",
  additionalProperties: false,
  required: ["spark"],
  properties: { spark: { type: "string" } },
};

export async function POST(request: Request) {
  if (!env.OPENAI_API_KEY) return Response.json({ error: "AI is not configured yet" }, { status: 503 });
  const thread = await request.json<SparkRequest>();
  if (!thread.title || !thread.observedPattern) {
    return Response.json({ error: "Open a Living Thread first" }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      instructions: `<spark_spec>
Return one very small creative spark drawn from the supplied Living Thread.

- Use 1–4 words whenever possible. Never exceed 6 words.
- Return only the spark inside the required JSON field.
- It may be a word, concrete image, action, tension, contradiction, question, or unfinished phrase.
- It does not need to be a complete sentence.
- Keep it open enough for the creator to interpret.
- Do not explain, summarize, instruct, praise, or name the Thread.
- Do not mention AI, memory, analysis, archive, creativity, or inspiration.
- Avoid generic words such as dream, memory, journey, explore, and create.
- Prefer language specific to the observed material without completing the artwork for its creator.
- Do not repeat the previous spark when one is supplied.

Good: "Almost through"; "Borrowed reflections"; "Who is looking?"; "Smaller than the room"; "Crossing, interrupted".
Bad: "Explore the theme of liminality in your work"; "Create something inspired by blue"; "Your archive suggests isolation".
</spark_spec>`,
      input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(thread) }] }],
      text: { format: { type: "json_schema", name: "drawer_spark", strict: true, schema: sparkSchema } },
      max_output_tokens: 120,
    }),
  });

  if (!response.ok) return Response.json({ error: "Drawer could not find a spark yet" }, { status: 502 });
  const result = await response.json<{ output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }>();
  const outputText = result.output_text
    ?? result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text
    ?? "";
  try {
    const parsed = JSON.parse(outputText) as { spark?: string };
    const spark = parsed.spark?.trim();
    if (!spark) throw new Error("Missing spark");
    return Response.json({ spark });
  } catch {
    return Response.json({ error: "Drawer received an incomplete spark" }, { status: 502 });
  }
}
