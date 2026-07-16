# Drawer

**An AI creative memory for unfinished ideas.**

Drawer is a private creative memory and retrieval system for photographers, designers, visual artists, and art students. It keeps images together with the voice notes and passing thoughts that made them meaningful, then helps creators rediscover patterns across time.

> The image is still there. The thought is gone. Drawer keeps both.

## Why Drawer

Creative tools are good at storing references, but they usually lose the personal context behind them. Drawer is not another moodboard, journal, or image generator. It is a memory layer for the creative process:

1. **Capture** an image, sentence, or unfinished voice note without organizing it first.
2. **Notice** recurring visual and linguistic patterns through evidence-based Living Threads.
3. **Return** to an older fragment through a contextual creative prompt rather than generated final artwork.

## Current prototype

- Responsive landing page with clear product positioning
- Image and text capture flow
- Multiple project Rooms with renaming and isolated content
- Zoomable, scrollable creative canvas
- Smooth fragment dragging, resizing, editing, and deletion
- Optional canvas grid and spatial relationship hints
- Prepared Living Thread with visual, language, and time evidence
- Contextual “Give me a word” retrieval experience
- User calibration actions for AI interpretations

Uploaded content and Room changes are currently session-only. Persistence and live GPT-5.6 analysis are the next implementation stage.

## Planned AI architecture

The production prototype will call OpenAI from server-side routes; the API key will never be exposed in the browser.

- `/api/analyze`: understand image and language context as structured fragment metadata
- `/api/threads`: propose recurring patterns with cited evidence from the current Room
- `/api/spark`: retrieve a word, constraint, or new entry point from a selected thread

AI connections remain hypotheses. The creator can inspect, accept, reject, or hide them.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Verify a production build:

```bash
npm run build
```

## Hackathon track

**Apps for Your Life** — built with Codex, with GPT-5.6 integration planned for multimodal creative memory, evidence-based pattern discovery, and contextual retrieval.

See [plan.md](./plan.md) for the product brief, demo narrative, scope, and remaining schedule.
