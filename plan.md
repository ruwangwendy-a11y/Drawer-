# Drawer — Product and Build Plan

## Product definition

**Hackathon track:** Apps for Your Life

**Primary audience:** Photographers, designers, visual artists, and art/design students who collect images alongside unfinished thoughts.

**Product category:** AI creative memory and retrieval system.

**Agent category:** A quiet creative-memory agent that captures, remembers, interprets, curates, and resurfaces the creator's own material.

Drawer preserves not only what inspired someone, but why it mattered. It keeps images, voice notes, sounds, and passing thoughts together; finds recurring visual language across time; and helps the creator return to unfinished ideas without generating the finished work for them.

> Creative tools remember what we saved, but forget why it mattered.

> The image is still there. The thought is gone. Drawer keeps both.

## Why this is an agent

Drawer is one product agent with several independently testable capabilities. It does not need a chat interface to be agentic. Its agency is visible in the way it observes new material, chooses the appropriate capability, produces an inspectable result, waits for feedback, and preserves that feedback for the next pass.

```text
Capture → Remember → Understand → Curate → Calibrate → Return → Learn
```

### 1. Capture

- Accept images, text, voice notes, and ambient sound.
- Require no title, tag, category, or explanation.
- Let the creator choose a target Room before saving.
- Support a user-selected default drawer for fast capture.

### 2. Remember

- Preserve the original file, audio, transcript, date, Room, and surrounding context.
- Persist Rooms, fragments, positions, scale, AI results, and feedback across refreshes.
- Treat manual movement as a possible relationship signal without assuming its meaning.

### 3. Understand

GPT-5.6 examines the archive across non-exclusive dimensions:

- motif and recurring objects;
- form, composition, color, light, and scale;
- material, texture, gesture, and process;
- spatial and narrative relationships;
- atmosphere and development across time.

Images are sufficient evidence. Text and voice deepen context but are never required. A fragment may support multiple patterns.

### 4. Curate

AI proposes semantic groups; a deterministic gallery engine turns those groups into a stable layout. The model does not generate arbitrary coordinates.

The gallery engine applies:

- one visual anchor per wall;
- supporting works at smaller scale;
- notes placed like labels near their evidence;
- language cards are a hard no-overlap layer: text and voice may never cover an image or one another;
- generous corridors between themes;
- original aspect ratios and image color;
- collision avoidance and preserved editability.

When AI is unavailable, Drawer falls back to a stable chronological gallery rather than failing or piling work together.

### 5. Calibrate

Living Threads are hypotheses, not conclusions. Every Thread cites concrete image, language, and time evidence. The creator can:

- accept it;
- reject it;
- hide it;
- restore it;
- inspect the supporting fragments.

### 6. Return

From a selected Thread, Drawer retrieves a small creative opening from the creator's own archive:

- a word;
- a short phrase;
- a constraint;
- an old fragment;
- a change of medium.

The Spark stays deliberately brief. It begins a response rather than completing the artwork.

### 7. Learn

For the hackathon demo, learning is represented through persisted feedback, rejected interpretations, accepted Threads, spatial edits, and repeated analysis of a growing Room. A production system would periodically summarize those signals into a lightweight long-term memory graph.

## System boundary

The engineering boundary is intentional:

| Layer | Responsibility |
| --- | --- |
| GPT-5.6 | Multimodal interpretation, evidence-based grouping, Living Threads, short retrieval seed |
| Transcription model | Convert voice into optional searchable context while preserving original audio |
| Gallery engine | Stable positions, hierarchy, spacing, collision avoidance, and fallback layout |
| Memory state | Rooms, assets, dates, positions, analysis snapshots, and feedback |
| Creator | Final meaning, acceptance, rejection, movement, and creative response |

This separation keeps the product consistent enough for a demo while allowing the intelligence to remain personal and adaptive.

## Experience principles

1. **Capture before explanation.** No organizational labor at the moment of inspiration.
2. **AI stays quiet until invited.** Intelligence appears at high-value moments rather than talking constantly.
3. **Preserve the original voice.** Raw audio and images are never replaced by summaries.
4. **Connections need evidence.** Every claim points back to the archive.
5. **The creator owns the meaning.** AI offers a reading, not a diagnosis or authoritative interpretation.
6. **Stable execution after flexible understanding.** GPT interprets; deterministic rules place.
7. **The archive becomes more valuable with time.** New fragments and feedback improve later retrieval.
8. **A Room should feel curated, not cleaned.** Order comes from visual relationships and breathing space, not a uniform grid.

## Current implementation — July 17

### Working now

- Responsive landing page and product narrative.
- Image, text, real browser voice, and ambient-sound capture.
- Server-side transcription with original audio preserved.
- Target Room selection during capture and a user-selected default drawer.
- Multiple named Rooms with isolated content.
- Durable assets and persisted Rooms, positions, sizes, notes, analyses, and feedback.
- Zoomable and scrollable editorial canvas with dragging, resizing, editing, and deletion.
- Original user image colors and aspect ratios.
- GPT-5.6 multimodal analysis across images, language, and time.
- Dynamic Living Threads with cited evidence and growth stages.
- Accept, reject, hide, undo, and show-all feedback paths.
- Short, thread-grounded Spark retrieval.
- Gallery-style one-click curation with deterministic fallback.
- Prepared Sample Room and a five-day test Room.
- Public deployment and GitHub repository.

### Agent orchestration status

The capabilities exist and share persisted state. The remaining orchestration work is to make the transition between them explicit and polished:

1. detect whether a Room has enough new material;
2. run or reuse analysis without unnecessary API calls;
3. pass semantic groups into the gallery engine;
4. explain what the curation changed;
5. retain creator feedback for the next analysis;
6. return the creator to a Thread through a minimal Spark.

## Remaining execution plan — July 17–20

### July 17 — Agent workflow and curation

- Finalize target Room and default-drawer capture behavior.
- Refine `Curate with AI` on the five-day Room.
- Verify GPT group → gallery wall → movable result.
- Add clear loading, fallback, and completion language.
- Prevent re-curation from destroying careful manual adjustments without warning.

**Exit condition:** a user can add five days of mixed fragments and receive a coherent, editable gallery in one action.

### July 18 — Memory and calibration

- Audit Living Thread evidence against both prepared Rooms.
- Ensure accepted and rejected readings persist and influence the next pass.
- Make overlapping membership understandable when one image supports several Threads.
- Clarify when `Discover Threads` differs from `Curate with AI`.
- Test image-only, text-light, and mixed-media Rooms.

**Exit condition:** the judge can see that Drawer learns from correction and does not require written explanations.

### July 19 — Golden path and presentation

- Lock the exact demo archive and starting state.
- Polish desktop Room and mobile capture breakpoints.
- Remove controls and branches that distract from the three-minute story.
- Write the narration, shot list, on-screen labels, and Devpost copy.
- Record Codex/GPT-5.6 development evidence and date-stamped implementation history.

**Exit condition:** one uninterrupted three-minute run clearly shows Capture, Memory, Understanding, Curation, Calibration, and Return.

### July 20 — Submission

- Run a clean-device production test.
- Check API secrets, cost limits, failure states, and persistence.
- Record and edit the final video.
- Finish Devpost description, screenshots, repository documentation, and submission evidence.
- Tag the submission build and preserve the working public URL.

**Exit condition:** public app, repository, video, and written submission all describe the same product and work as shown.

## Demo narrative

### Opening

> “I save hundreds of images, but months later, I no longer remember why they mattered. The image is still there. The thought is gone.”

> “Drawer keeps both.”

### Golden path

1. Capture an image and an unrehearsed voice note into a chosen Room.
2. Close the Drawer and open the growing archive.
3. Let Drawer identify recurring visual language across several dates.
4. Use **Curate with AI** to turn those relationships into an editable gallery.
5. Open a blue Living Thread and inspect the exact supporting works.
6. Confirm one Thread and reject another.
7. Ask for a Spark and receive only a word or very short phrase.
8. Place the creator's new response back into Drawer.

### Closing

> Before AI generates your next idea, it should remember your last unfinished one.

> The AI does not invent the creator's language. It helps the creator hear it sooner.

## Explicitly out of scope

- Native iOS or Android builds for the hackathon.
- Literal 3D rooms or physics-driven layouts.
- A truly unbounded collaborative whiteboard engine.
- Social feeds, likes, follows, or public-by-default archives.
- Complex authentication or third-party library imports.
- AI-generated final artwork.
- Psychological diagnosis or claims about subconscious intent.
- A full production-grade long-term vector memory system.

## Success criteria

Within three minutes, a judge should understand:

1. why inspiration tools lose personal creative context;
2. why multimodal AI is needed to reconnect images, language, sound, and time;
3. why Drawer is a memory agent rather than a moodboard or chatbot;
4. how GPT interpretation and deterministic gallery layout work together;
5. how evidence and user correction keep meaning under creator control;
6. how retrieval advances creation without producing the finished work.
