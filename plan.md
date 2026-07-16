# Drawer — Build Plan

## Product definition

**Category:** Apps for Your Life  
**Primary audience:** Visual creatives, beginning with art and design students, photographers, and designers who collect images alongside unfinished thoughts.  
**Product category:** AI creative memory and retrieval system.

Drawer preserves not only what inspired someone, but why it mattered. It captures images, voice notes, and unfinished thoughts; discovers recurring patterns across time; and helps the creator return to those fragments without generating the work for them.

### Core problem

> Creative tools remember what we saved, but forget why it mattered.

Images remain in photo libraries and reference boards, while the thought that made them meaningful disappears into voice notes, memory, or nowhere at all. Search cannot recover a connection the creator never named.

### Product promise

> The image is still there. The thought is gone. Drawer keeps both.

### Positioning

- Not an AI moodboard, journal, Pinterest clone, or image organizer.
- Not a tool that generates finished artwork or interprets the creator as an authority.
- A private creative memory that preserves context, proposes evidence-based connections, and retrieves unfinished ideas when they can become useful again.

### Homepage copy — current

**Audience:** For photographers, designers & visual artists.  
**Headline:** An AI creative memory for unfinished ideas.  
**Subhead:** Save images, voice notes, and passing thoughts in one private space. Drawer remembers why they mattered, notices hidden threads across time, and brings them back when you are ready to create.  
**Primary action:** Put something away.

**Positioning line:** Not another moodboard. A memory layer for your creative process.

## Experience principles

1. **Capture before explanation.** Adding a fragment should require no title, tags, or category.
2. **AI stays quiet until invited.** The intelligence is visible at one high-value moment, not noisy everywhere.
3. **Preserve the original voice.** Raw audio and transcription remain intact; AI summaries never replace them.
4. **Connections need evidence.** Every Living Thread cites visual, language, and time signals from the user's own material.
5. **The user owns the meaning.** Threads are hypotheses that can be accepted, rejected, hidden, or inspected.
6. **Leave room for interpretation.** Retrieval should open a direction, not finish the work.
7. **Visual freedom, engineering control.** The Room uses restrained editorial templates rather than an unstable physics layout or 3D scene.

## Visual direction

The interface should feel quiet, precise, and tactile: Apple-level restraint with Notion-like clarity.

- Warm off-white background rather than clinical pure white.
- Near-black typography, muted gray metadata, and one subtle accent.
- Large areas of negative space and deliberate image scale changes.
- A small number of controls with plain language.
- Soft opacity, focus, and drawer transitions; no decorative motion.
- Desktop-first Room; mobile-first capture.
- The Room is a two-dimensional editorial canvas, not a literal 3D room.
- Underlying layout uses a small set of deterministic templates so the demo remains stable.

## Core experience

### 1. Drawer — Quick Capture

The creator can add any one of:

- an image;
- a sentence;
- a voice note;
- an image with a voice note.

No required metadata. After saving, the drawer closes with the confirmation: **Kept for later.**

### 2. The Room — Multimodal Creative Archive

When the creator returns, fragments appear in a restrained editorial arrangement rather than a standard grid. The Room includes:

- images at varied but controlled scales;
- original notes and voice transcripts;
- dates and quiet contextual metadata;
- a memory rail for revisiting earlier language;
- subtle focus states that reveal related fragments.

### 3. Living Threads — Evidence-based Pattern Discovery

This is the primary AI proof point. A thread is supported by three layers:

- **Visual evidence:** repeated structures, objects, colors, compositions, or spatial relationships.
- **Language evidence:** repeated words, metaphors, emotional descriptions, or unfinished phrases.
- **Time evidence:** the pattern appears across different moments rather than a single upload batch.

Example:

> **Thresholds — 7 fragments across 18 days**  
> Visual: partially blocked entrances, narrow passageways, frames within frames.  
> Language: “between,” “not fully inside,” “almost entering.”

Available actions:

- This feels right
- Not really
- Hide this thread
- Show me the evidence

### 4. Return to This Thread — Contextual Creative Retrieval

Retrieval begins with a selected thread and returns a new way into the creator's own material. It may provide:

- one word;
- an unfinished line;
- a medium shift;
- a constraint;
- an older fragment worth revisiting.

Example: **Make something that never fully opens.**

The user responds through voice, text, or a new image. That response returns to Drawer and becomes part of the evolving memory.

## Demo narrative

### Opening problem

> “I save hundreds of images, but months later, I no longer remember why they mattered. The image is still there. The thought is gone.”

> “Drawer keeps both.”

### Golden path

1. Add several visual fragments.
2. Attach an unrehearsed voice note to one image.
3. Close the Drawer.
4. Open the Room and see the fragments quietly arranged.
5. Reveal **Thresholds — 7 fragments across 18 days**.
6. Inspect concise visual, language, and time evidence.
7. Mark the thread as meaningful.
8. Select **Return to this thread**.
9. Receive: **Make something that never fully opens.**
10. Record a new response and place it back in Drawer.

### Closing position

> Before AI generates your next idea, it should remember your last unfinished one.

> The AI does not invent the creator's language. It helps the creator hear it sooner.

## Remaining five-day scope — July 16–20

### Must ship

- Responsive Web App with a desktop-first Room and usable mobile capture.
- Restrained landing and product shell.
- Image, text, and voice-note capture interaction.
- Drawer close/save state.
- Stable editorial Room layout using deterministic templates.
- Memory rail with prior notes and transcripts.
- One strong Living Thread with visual, language, and time evidence.
- Thread feedback: agree, disagree, hide, show evidence.
- Contextual creative retrieval from a selected thread.
- A prepared sample archive so judges can try the experience immediately.
- Clear boundary: AI offers hypotheses and prompts, not authoritative psychological interpretation.

### Simulated for the first prototype

- Voice transcription may use a prepared transcript while the recording interaction is demonstrated.
- Pattern analysis may use a deterministic sample response before live GPT-5.6 integration.
- Persistence may remain device-local for the demo.

### Explicitly out of scope

- Native iOS or Android applications.
- 3D rooms, physics layouts, or infinite canvas navigation.
- Full drag-and-drop spatial editing.
- Social feed, likes, follows, or comments.
- Public-by-default archives.
- Complex authentication.
- Pinterest, Instagram, or photo-library imports.
- AI-generated final artwork.
- Psychological diagnosis or claims about the user's subconscious.

## Implementation sequence

### July 16 — Stable prototype and repository

- Clarify the homepage audience, category, problem, and AI role.
- Stabilize capture, canvas editing, Room switching, and Spark exit paths.
- Initialize Git, document the current prototype, and push the first GitHub version.

### July 17 — Persistence and complete capture

- Persist Rooms, positions, sizes, notes, and uploads across refreshes.
- Complete the voice capture/transcript path or an honest demo fallback.
- Add clear empty, loading, and failure states.

### July 18 — Live AI proof point

- Connect GPT-5.6 through a server-side API route.
- Analyze image + language context into structured fragment metadata.
- Make Living Threads and Give me a word respond to the current Room.

### July 19 — Golden path and visual polish

- Prepare one coherent sample archive with evidence across time.
- Refine hierarchy, responsive behavior, motion, and interaction feedback.
- Rehearse the complete three-minute demo and remove distracting branches.

### July 20 — Submission package

- Validate, deploy, and test the public build on a clean device.
- Record and edit the under-three-minute video.
- Complete Devpost copy, README, setup instructions, and Codex/GPT-5.6 evidence.

## Success criteria

The prototype succeeds if a judge can understand within three minutes:

1. why existing inspiration tools lose creative context;
2. why multimodal AI is required to reconnect images, language, and time;
3. how Living Threads differs from visual clustering;
4. how user feedback keeps interpretation under the creator's control;
5. how retrieval advances creation without generating the work itself.
