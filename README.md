# Drawer

**A quiet AI creative-memory agent for unfinished ideas.**

Drawer helps photographers, designers, visual artists, and art students preserve images together with the voice notes, sounds, and passing thoughts that made them meaningful. It uses multimodal AI to notice recurring visual language across time, curates related fragments into an editable gallery, and returns a small creative opening when the creator is ready to continue.

> The image is still there. The thought is gone. Drawer keeps both.

## What makes Drawer different

Drawer is not another moodboard, journal, image organizer, or artwork generator. It is a memory layer for the creative process.

```text
Capture → Remember → Understand → Curate → Calibrate → Return → Learn
```

- **Capture:** Save an image, sentence, voice note, or ambient sound without titles or tags.
- **Remember:** Preserve the original material, its Room, time, context, and spatial arrangement.
- **Understand:** Use GPT-5.6 to find recurring motifs, objects, colors, forms, materials, spaces, gestures, and temporal patterns.
- **Curate:** Turn AI-proposed relationships into a stable gallery with visual anchors, supporting works, labels, and breathing space.
- **Calibrate:** Inspect the evidence, accept or reject a Living Thread, and keep interpretation under creator control.
- **Return:** Retrieve a word, phrase, constraint, or older fragment instead of generating the finished work.
- **Learn:** Persist feedback and spatial edits so the archive becomes more personal over time.

## Current prototype

- Image, text, voice-note, and sound capture
- Target Room selection and user-set default drawer
- Multiple named Rooms with isolated, durable content
- Server-side voice transcription with original audio preserved
- Zoomable and scrollable editorial canvas
- Smooth dragging, resizing, text editing, and deletion
- Original image color and aspect-ratio preservation
- GPT-5.6 multimodal Living Threads with cited evidence
- Growth stages across time: seed, emerging, and recurring
- Accept, reject, hide, restore, and show-evidence interactions
- Thread-grounded short Spark retrieval
- `Curate with AI`: semantic grouping plus deterministic gallery layout
- Stable chronological fallback when AI is unavailable
- Prepared Sample Room and five-day curation test Room
- Persisted assets, layouts, analysis results, and feedback

## Agent architecture

Drawer separates flexible interpretation from stable execution:

| Component | Role |
| --- | --- |
| GPT-5.6 | Understand multimodal relationships, propose Living Threads, and produce a minimal Spark |
| Transcription model | Make voice optionally searchable without replacing the original recording |
| Gallery engine | Convert semantic groups into reliable, editable exhibition walls |
| Memory state | Persist Rooms, fragments, positions, analysis snapshots, and creator feedback |
| Creator | Decide what a connection means and how the work should continue |

The model never receives authority over the creator's meaning and never generates arbitrary canvas coordinates. AI proposes relationships; deterministic layout rules execute them; the creator can move everything afterward.

## Main server routes

- `/api/analyze` — multimodal GPT-5.6 analysis and structured evidence-based Living Threads
- `/api/transcribe` — voice transcription
- `/api/spark` — short retrieval from a selected Thread
- `/api/assets` — durable image and audio assets
- `/api/state` — Rooms, layouts, analyses, and feedback persistence

OpenAI credentials are used only by server-side routes and are never exposed in the browser.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To use live transcription and GPT analysis locally, configure the required server-side OpenAI environment secret. Without it, capture, memory, editing, and deterministic gallery curation continue to work through graceful fallbacks.

Verify a production build:

```bash
npm run build
```

## Hackathon

**Track:** Apps for Your Life

**Built with:** Codex and GPT-5.6

**Positioning:** Before AI generates your next idea, it should remember your last unfinished one.

See [plan.md](./plan.md) for the product definition, agent workflow, demo narrative, remaining schedule, and success criteria.
