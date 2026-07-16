"use client";

import { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type View = "landing" | "drawer" | "room";
type ThreadState = "idle" | "evidence" | "accepted" | "rejected";
type CapturedImage = { id: string; src: string; name: string; note: string; date: string; width: number; height: number; roomId?: string };
type CapturedText = { id: string; text: string; date: string; roomId: string };
type CapturedAudio = { id: string; src: string; date: string; duration: number; roomId: string; transcript?: string };
type Point = { x: number; y: number };
type AiThread = {
  id: string;
  title: string;
  summary: string;
  visualEvidence: string[];
  languageEvidence: string[];
  timeEvidence: string;
  fragmentIds: string[];
  spark: string;
};

const fragmentHomes: Record<string, Point> = {
  corridor: { x: 278, y: 280 },
  subway: { x: 785, y: 223 },
  hall: { x: 1433, y: 508 },
  gate: { x: 698, y: 841 },
  reflectionOne: { x: 1900, y: 270 },
  reflectionTwo: { x: 2430, y: 350 },
  reflectionThree: { x: 1855, y: 850 },
  reflectionFour: { x: 2650, y: 880 },
  reflectionFive: { x: 2220, y: 1420 },
};

const memoryHomes = [
  { x: 570, y: 260 },
  { x: 1045, y: 505 },
  { x: 1295, y: 915 },
  { x: 2050, y: 430 },
  { x: 2350, y: 1050 },
  { x: 2500, y: 1430 },
];

const fragments = [
  {
    id: "corridor",
    src: "/fragment-UN7-iS_79oE.jpg",
    alt: "Blurred figures in a dim corridor",
    date: "June 12",
    className: "fragment fragment--corridor",
  },
  {
    id: "subway",
    src: "/fragment-f31YwqhKrug.jpg",
    alt: "Reflections on a subway platform at night",
    date: "June 18",
    className: "fragment fragment--subway",
  },
  {
    id: "hall",
    src: "/fragment-lldl9L5oYYA.jpg",
    alt: "A green corridor with repeated doorways",
    date: "June 24",
    className: "fragment fragment--hall",
  },
  {
    id: "gate",
    src: "/fragment-h2n05gBQT-M.jpg",
    alt: "A quiet subway entrance gate",
    date: "June 29",
    className: "fragment fragment--gate",
  },
  {
    id: "reflectionOne",
    src: "/sample-reflection-1846.jpg",
    alt: "Pedestrian signs multiplied in a dark glass reflection",
    date: "Reflection study · 01",
    className: "fragment fragment--original-color fragment--reflection-one",
  },
  {
    id: "reflectionTwo",
    src: "/sample-reflection-1847.jpg",
    alt: "Bare trees reflected across a modern building facade",
    date: "Reflection study · 02",
    className: "fragment fragment--original-color fragment--reflection-two",
  },
  {
    id: "reflectionThree",
    src: "/sample-reflection-1848.jpg",
    alt: "Empty theater seats seen through a reflective storefront window",
    date: "Reflection study · 03",
    className: "fragment fragment--original-color fragment--reflection-three",
  },
  {
    id: "reflectionFour",
    src: "/sample-reflection-1849.jpg",
    alt: "A bright pedestrian sign in front of city buildings",
    date: "Reflection study · 04",
    className: "fragment fragment--original-color fragment--reflection-four",
  },
  {
    id: "reflectionFive",
    src: "/sample-reflection-1870.jpg",
    alt: "A construction worker and street scene layered through glass reflections",
    date: "Reflection study · 05",
    className: "fragment fragment--original-color fragment--reflection-five",
  },
];

const memoryNotes = [
  {
    date: "June 12 · voice note",
    text: "I keep photographing places that look like they are waiting for someone to cross.",
    target: "corridor",
  },
  {
    date: "June 18 · voice note",
    text: "Not fully inside. Not outside either. Maybe that is the part I want to keep.",
    target: "subway",
  },
  {
    date: "June 29 · note",
    text: "A place can be open and still refuse you.",
    target: "gate",
  },
  {
    date: "Assignment note · reflection study",
    text: "I thought I was photographing signs. The glass kept putting the viewer back into the picture.",
    target: "reflectionOne",
  },
  {
    date: "Assignment note · reflection study",
    text: "The reflection is always there, but most of the time we look through it.",
    target: "reflectionThree",
  },
  {
    date: "Unfinished thought · reflection study",
    text: "Maybe a window does not only show what is behind it. It also keeps what passes in front.",
    target: "reflectionFive",
  },
];

const ROOM_WIDTH = 3200;
const ROOM_HEIGHT = 2200;

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [threadState, setThreadState] = useState<ThreadState>("idle");
  const [focusedFragment, setFocusedFragment] = useState<string | null>(null);
  const [sparkOpen, setSparkOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState<CapturedImage[]>([]);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [capturedTexts, setCapturedTexts] = useState<CapturedText[]>([]);
  const [capturedAudios, setCapturedAudios] = useState<CapturedAudio[]>([]);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [relationSignal, setRelationSignal] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.78);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scales, setScales] = useState<Record<string, number>>({});
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [memoryItems, setMemoryItems] = useState(memoryNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [rooms, setRooms] = useState([{ id: "sample", name: "Sample room", isSample: true }]);
  const [currentRoomId, setCurrentRoomId] = useState("sample");
  const [renamingRoom, setRenamingRoom] = useState(false);
  const [roomNameDraft, setRoomNameDraft] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [aiThreads, setAiThreads] = useState<Record<string, AiThread[]>>({});
  const [activeAiThreadId, setActiveAiThreadId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const dragState = useRef<{ id: string; startX: number; startY: number; origin: Point; target: HTMLElement } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);
  const recordingStartedAt = useRef(0);

  const roomClass = useMemo(
    () => `room-canvas${threadState !== "idle" ? " room-canvas--thread" : ""}`,
    [threadState],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    if (!sparkOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSparkOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sparkOpen]);

  useEffect(() => {
    const stored = window.localStorage.getItem("drawer-device-id");
    const id = stored ?? crypto.randomUUID();
    if (!stored) window.localStorage.setItem("drawer-device-id", id);
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    fetch("/api/state", { headers: { "x-drawer-device": deviceId } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load your Drawer")))
      .then(({ state }) => {
        if (state) {
          setCapturedImages(state.capturedImages ?? []);
          setCapturedTexts(state.capturedTexts ?? []);
          setCapturedAudios(state.capturedAudios ?? []);
          setAiThreads(state.aiThreads ?? {});
          setMemoryItems(state.memoryItems ?? memoryNotes);
          setPositions(state.positions ?? {});
          setScales(state.scales ?? {});
          setHiddenIds(state.hiddenIds ?? []);
          setRooms(state.rooms?.length ? state.rooms : [{ id: "sample", name: "Sample room", isSample: true }]);
          setCurrentRoomId(state.currentRoomId ?? "sample");
        }
      })
      .catch(() => setRelationSignal("Drawer could not restore saved fragments. New work will still stay in this session."))
      .finally(() => setHydrated(true));
  }, [deviceId]);

  useEffect(() => {
    if (!hydrated || !deviceId) return;
    const timer = window.setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json", "x-drawer-device": deviceId },
        body: JSON.stringify({ capturedImages, capturedTexts, capturedAudios, aiThreads, memoryItems, positions, scales, hiddenIds, rooms, currentRoomId }),
      }).catch(() => undefined);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [hydrated, deviceId, capturedImages, capturedTexts, capturedAudios, aiThreads, memoryItems, positions, scales, hiddenIds, rooms, currentRoomId]);

  useEffect(() => () => {
    if (recordingTimer.current) window.clearInterval(recordingTimer.current);
    mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  function readFiles(files: FileList | File[]) {
    [...files].filter((file) => file.type.startsWith("image/")).slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const probe = new Image();
        probe.onload = () => setPendingImages((current) => [...current, {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          src,
          name: file.name,
          note: "",
          date: "Just now",
          width: probe.naturalWidth,
          height: probe.naturalHeight,
        }]);
        probe.src = src;
      };
      reader.readAsDataURL(file);
    });
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) readFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    readFiles(event.dataTransfer.files);
  }

  function removePending(id: string) {
    setPendingImages((current) => current.filter((image) => image.id !== id));
  }

  async function uploadAsset(blob: Blob, name: string) {
    const form = new FormData();
    form.append("file", blob, name);
    const response = await fetch("/api/assets", { method: "POST", headers: { "x-drawer-device": deviceId }, body: form });
    if (!response.ok) throw new Error("Upload failed");
    return (await response.json()).src as string;
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop();
      return;
    }
    try {
      setRecordingError("");
      if (recordedAudio) URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });
      audioChunks.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunks.current.push(event.data); };
      recorder.onstop = () => {
        const duration = Math.max(1, Math.round((Date.now() - recordingStartedAt.current) / 1000));
        const blob = new Blob(audioChunks.current, { type: recorder.mimeType || "audio/webm" });
        setRecordedAudio({ blob, url: URL.createObjectURL(blob), duration });
        setRecording(false);
        setRecordingSeconds(duration);
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimer.current) window.clearInterval(recordingTimer.current);
      };
      mediaRecorder.current = recorder;
      recordingStartedAt.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
      recorder.start(250);
      recordingTimer.current = window.setInterval(() => setRecordingSeconds(Math.floor((Date.now() - recordingStartedAt.current) / 1000)), 500);
    } catch {
      setRecordingError("Microphone access was not available. You can still leave a written thought.");
      setRecording(false);
    }
  }

  function discardRecording() {
    if (recordedAudio) URL.revokeObjectURL(recordedAudio.url);
    setRecordedAudio(null);
    setRecordingSeconds(0);
  }

  async function keepFragment() {
    if (saving || recording || !deviceId) return;
    setSaving(true);
    setRecordingError("");
    try {
      const uploadedImages = await Promise.all(pendingImages.map(async (image) => {
        const blob = await (await fetch(image.src)).blob();
        const src = await uploadAsset(blob, image.name);
        return { ...image, src, note: "", roomId: currentRoomId };
      }));
      setCapturedImages((current) => [...current, ...uploadedImages]);
      if (draft.trim()) {
        setCapturedTexts((current) => [...current, {
          id: `text-${Date.now()}`,
          text: draft.trim(),
          date: "Just now · text note",
          roomId: currentRoomId,
        }]);
      }
      if (recordedAudio) {
        let transcript = "";
        try {
          const transcriptForm = new FormData();
          transcriptForm.append("audio", recordedAudio.blob, `voice-${Date.now()}.webm`);
          const transcriptResponse = await fetch("/api/transcribe", { method: "POST", body: transcriptForm });
          if (transcriptResponse.ok) transcript = (await transcriptResponse.json()).transcript ?? "";
        } catch {
          // The original recording remains useful even when transcription is unavailable.
        }
        const src = await uploadAsset(recordedAudio.blob, `voice-${Date.now()}.webm`);
        setCapturedAudios((current) => [...current, { id: `audio-${Date.now()}`, src, date: "Just now · voice note", duration: recordedAudio.duration, roomId: currentRoomId, transcript }]);
      }
      setSaved(true);
      window.setTimeout(() => {
        setSaved(false);
        setPendingImages([]);
        setDraft("");
        discardRecording();
        setView("room");
      }, 700);
    } catch {
      setRecordingError("This fragment could not be saved yet. Nothing has been removed—please try again.");
    } finally {
      setSaving(false);
    }
  }

  function startMove(event: ReactPointerEvent<HTMLElement>, id: string) {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragState.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      origin: positions[id] ?? { x: 0, y: 0 },
      target,
    };
    setSelectedId(id);
    setDraggingId(id);
  }

  function moveFragment(event: ReactPointerEvent<HTMLElement>) {
    const active = dragState.current;
    if (!active) return;
    const x = active.origin.x + (event.clientX - active.startX) / zoom;
    const y = active.origin.y + (event.clientY - active.startY) / zoom;
    active.target.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scales[active.id] ?? 1})`;
  }

  function endMove(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (!dragState.current) return;
    const active = dragState.current;
    const finalPosition = {
      x: active.origin.x + (event.clientX - active.startX) / zoom,
      y: active.origin.y + (event.clientY - active.startY) / zoom,
    };
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
    setDraggingId(null);
    setPositions((current) => ({ ...current, [id]: finalPosition }));
    const kind = id.startsWith("memory-") ? "This memory" : id.startsWith("audio-") ? "This voice note" : id.startsWith("user-") ? "Your new fragment" : "This fragment";
    setRelationSignal(`${kind} was moved. Drawer will treat its new neighbors as a relationship signal.`);
    window.setTimeout(() => setRelationSignal(null), 3200);
  }

  function connectorStyle(noteIndex: number, targetId: string) {
    const noteOffset = positions[`memory-${noteIndex}`] ?? { x: 0, y: 0 };
    const targetOffset = positions[targetId] ?? { x: 0, y: 0 };
    const from = { x: memoryHomes[noteIndex].x + noteOffset.x, y: memoryHomes[noteIndex].y + noteOffset.y };
    const targetHome = fragmentHomes[targetId];
    const to = { x: targetHome.x + targetOffset.x, y: targetHome.y + targetOffset.y };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const moving = draggingId === `memory-${noteIndex}` || draggingId === targetId;
    const hidden = hiddenIds.includes(`memory-${noteIndex}`) || hiddenIds.includes(targetId);
    return {
      left: `${from.x}px`,
      top: `${from.y}px`,
      width: `${distance}px`,
      transform: `rotate(${Math.atan2(dy, dx)}rad)`,
      opacity: hidden || moving || distance > 560 ? 0 : Math.max(.18, 1 - distance / 760),
    };
  }

  function itemTransform(id: string) {
    const point = positions[id] ?? { x: 0, y: 0 };
    return `translate3d(${point.x}px, ${point.y}px, 0) scale(${scales[id] ?? 1})`;
  }

  function resizeSelected(delta: number) {
    if (!selectedId) return;
    setScales((current) => ({ ...current, [selectedId]: Math.min(1.8, Math.max(.55, (current[selectedId] ?? 1) + delta)) }));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setHiddenIds((current) => [...current, selectedId]);
    setSelectedId(null);
  }

  function beginTextEdit() {
    if (!selectedId) return;
    if (selectedId.startsWith("memory-")) {
      const index = Number(selectedId.split("-")[1]);
      setEditValue(memoryItems[index]?.text ?? "");
      setEditingId(selectedId);
    } else if (selectedId.startsWith("text-")) {
      setEditValue(capturedTexts.find((item) => item.id === selectedId)?.text ?? "");
      setEditingId(selectedId);
    }
  }

  function saveTextEdit() {
    if (!editingId || !editValue.trim()) return;
    if (editingId.startsWith("memory-")) {
      const index = Number(editingId.split("-")[1]);
      setMemoryItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: editValue.trim() } : item));
    } else {
      setCapturedTexts((current) => current.map((item) => item.id === editingId ? { ...item, text: editValue.trim() } : item));
    }
    setEditingId(null);
  }

  function addTextToRoom() {
    const id = `text-${Date.now()}`;
    setCapturedTexts((current) => [...current, { id, text: "An unfinished thought…", date: "Just now · text note", roomId: currentRoomId }]);
    setSelectedId(id);
    setEditValue("");
    setEditingId(id);
  }

  function addRoom() {
    const nextNumber = rooms.length + 1;
    const room = { id: `room-${Date.now()}`, name: `Untitled room ${nextNumber}`, isSample: false };
    setRooms((current) => [...current, room]);
    setCurrentRoomId(room.id);
    setSelectedId(null);
    setView("room");
  }

  const currentRoom = rooms.find((room) => room.id === currentRoomId) ?? rooms[0];

  function renameRoom() {
    setRoomNameDraft(currentRoom.name);
    setRenamingRoom(true);
  }

  function saveRoomName() {
    const nextName = roomNameDraft.trim();
    if (!nextName) return;
    setRooms((items) => items.map((room) => room.id === currentRoomId ? { ...room, name: nextName } : room));
    setRenamingRoom(false);
  }

  async function discoverThreads() {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalysisError("");
    setActiveAiThreadId(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomName: currentRoom.name,
          images: [
            ...(currentRoom.isSample ? fragments.filter((item) => !hiddenIds.includes(item.id)).map(({ id, src, date }) => ({ id, src, date })) : []),
            ...roomImages.filter((item) => !hiddenIds.includes(item.id)).map(({ id, src, date }) => ({ id, src, date })),
          ],
          texts: [
            ...(currentRoom.isSample ? memoryItems.map((item, index) => ({ id: `memory-${index}`, text: item.text, date: item.date })) : []),
            ...roomTexts.filter((item) => !hiddenIds.includes(item.id)).map(({ id, text, date }) => ({ id, text, date })),
          ],
          audios: roomAudios.filter((item) => !hiddenIds.includes(item.id) && item.transcript).map(({ id, transcript, date }) => ({ id, transcript, date })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Drawer could not find a thread yet");
      const threads = (result.threads ?? []) as AiThread[];
      setAiThreads((current) => ({ ...current, [currentRoomId]: threads }));
      if (threads[0]) setActiveAiThreadId(threads[0].id);
      else setAnalysisError("No repeated thread was strong enough yet. Add another fragment and return later.");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Drawer could not find a thread yet");
    } finally {
      setAnalyzing(false);
    }
  }

  const roomImages = capturedImages.filter((image) => (image.roomId ?? "sample") === currentRoomId);
  const roomTexts = capturedTexts.filter((text) => text.roomId === currentRoomId);
  const roomAudios = capturedAudios.filter((audio) => audio.roomId === currentRoomId);
  const currentAiThreads = aiThreads[currentRoomId] ?? [];
  const activeAiThread = currentAiThreads.find((thread) => thread.id === activeAiThreadId) ?? null;
  const visibleSampleFragments = currentRoom.isSample
    ? fragments.filter((fragment) => !hiddenIds.includes(fragment.id)).length
      + memoryItems.filter((_, index) => !hiddenIds.includes(`memory-${index}`)).length
    : 0;
  const visibleRoomCount = visibleSampleFragments
    + roomImages.filter((image) => !hiddenIds.includes(image.id)).length
    + roomTexts.filter((text) => !hiddenIds.includes(text.id)).length
    + roomAudios.filter((audio) => !hiddenIds.includes(audio.id)).length;

  function formatDuration(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  return (
    <main className={`app app--${view}`}>
      <header className="topbar">
        <button className="wordmark" onClick={() => setView("landing")} aria-label="Drawer home">
          Drawer<span className="wordmark-dot">.</span>
        </button>
        <nav aria-label="Primary navigation">
          <button className={view === "drawer" ? "nav-link is-active" : "nav-link"} onClick={() => setView("drawer")}>Put away</button>
          <button className={view === "room" ? "nav-link is-active" : "nav-link"} onClick={() => setView("room")}>Open the room</button>
        </nav>
        <span className="topbar-note">Private creative memory</span>
      </header>

      {view === "landing" && (
        <section className="landing" aria-labelledby="landing-title">
          <div className="landing-copy">
            <p className="eyebrow">For photographers, designers &amp; visual artists</p>
            <h1 id="landing-title">An AI creative memory<br /><em>for unfinished ideas.</em></h1>
            <p className="intro">Save images, voice notes, and passing thoughts in one private space. Drawer remembers why they mattered, notices hidden threads across time, and brings them back when you are ready to create.</p>
            <div className="landing-actions">
              <button className="primary-button" onClick={() => setView("drawer")}>Put something away <span aria-hidden="true">→</span></button>
              <button className="text-button" onClick={() => setView("room")}>Explore a sample room</button>
            </div>
            <p className="positioning-note">Not another moodboard. A memory layer for your creative process.</p>
          </div>
          <div className="landing-art" aria-hidden="true">
            <div className="landing-photo landing-photo--one"><img src="/fragment-UN7-iS_79oE.jpg" alt="" /></div>
            <div className="landing-photo landing-photo--two"><img src="/fragment-f31YwqhKrug.jpg" alt="" /></div>
            <p className="landing-whisper">“The image and the thought, kept together.”</p>
            <span className="landing-thread" />
          </div>
          <p className="landing-footer">The image is still there. The thought is gone. Drawer keeps both.</p>
          <section className="landing-story" aria-label="Why Drawer exists">
            <div className="story-lead">
              <p className="eyebrow">Why Drawer</p>
              <h2>Creative tools remember<br />what we saved, <em>but forget<br />why it mattered.</em></h2>
            </div>
            <div className="story-copy">
              <p>Images remain in photo libraries. Unfinished thoughts disappear into voice notes, memory, or nowhere at all. Drawer keeps the object and the thought together—before their connection is lost.</p>
              <p>It does not generate the work for you. It helps you recognize the visual language that is already becoming yours.</p>
            </div>
            <div className="story-steps">
              <article><span>01</span><h3>Capture</h3><p>Put away an image, a sentence, or an unprepared voice note without organizing it first.</p></article>
              <article><span>02</span><h3>Notice</h3><p>GPT-5.6 finds recurring visual, linguistic, and temporal patterns—with evidence you can accept or reject.</p></article>
              <article><span>03</span><h3>Return</h3><p>Revisit an unfinished thread through a word, constraint, old image, or new way into your own material.</p></article>
            </div>
          </section>
        </section>
      )}

      {view === "drawer" && (
        <section className={`drawer-view${saved ? " is-closing" : ""}`} aria-labelledby="drawer-title">
          <div className="drawer-heading">
            <p className="eyebrow">Quick capture</p>
            <h1 id="drawer-title">Put something away.</h1>
            <p>No title. No tags. You can explain it later—or not at all.</p>
          </div>
          <div className="drawer-shell">
            <div className="drawer-content">
              <div className={`upload-card${pendingImages.length ? " has-images" : ""}`} role="button" tabIndex={0} onClick={() => fileInput.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                {pendingImages.length ? (
                  <div className="upload-preview-grid">
                    {pendingImages.map((image) => (
                      <span className="upload-preview" key={image.id}>
                        <img src={image.src} alt={`Preview of ${image.name}`} />
                        <button type="button" onClick={(event) => { event.stopPropagation(); removePending(image.id); }} aria-label={`Remove ${image.name}`}>×</button>
                      </span>
                    ))}
                    <span className="upload-more">+</span>
                  </div>
                ) : (
                  <>
                    <span className="upload-plus">+</span>
                    <span>Add an image</span>
                    <small>Click or drop up to 6 images</small>
                  </>
                )}
              </div>
              <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleUpload} hidden />
              <div className="capture-divider"><span>and / or</span></div>
              <div className="voice-card">
                <button
                  className={recording ? "record-button is-recording" : "record-button"}
                  onClick={toggleRecording}
                  aria-label={recording ? "Stop recording" : "Start recording"}
                >
                  <span />
                </button>
                <div className="voice-card-copy">
                  <strong>{recording ? `Listening… ${formatDuration(recordingSeconds)}` : recordedAudio ? `Voice note ready · ${formatDuration(recordedAudio.duration)}` : "Hold a thought"}</strong>
                  <p>{recording ? "Say it before it becomes clear. Tap the square when you are done." : recordedAudio ? "Listen once, or keep it exactly as it arrived." : "Tell me what caught you—even if you don’t know why."}</p>
                  {recordedAudio && !recording && (
                    <div className="recorded-audio">
                      <audio controls src={recordedAudio.url} />
                      <button type="button" onClick={discardRecording}>Discard</button>
                    </div>
                  )}
                </div>
              </div>
              {recordingError && <p className="recording-error" role="status">{recordingError}</p>}
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Or leave an unfinished sentence…" aria-label="Unfinished thought" />
            </div>
            <button className="drawer-handle" onClick={keepFragment} disabled={saving || recording || (!pendingImages.length && !draft.trim() && !recordedAudio)}>
              <span>{saving ? "Keeping it safe…" : saved ? "Kept for later." : "Close the drawer"}</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </section>
      )}

      {view === "room" && (
        <section className="room-view" aria-labelledby="room-title">
          <div className="room-header">
            <div className="room-identity">
              <div className="room-switcher">
                <select value={currentRoomId} onChange={(event) => { setCurrentRoomId(event.target.value); setSelectedId(null); }} aria-label="Current room">
                  {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                </select>
                <button onClick={renameRoom} aria-label="Rename this room">Edit</button>
                <button onClick={addRoom} aria-label="Create a new room">+</button>
              </div>
              <p>{visibleRoomCount} fragments · last opened just now</p>
            </div>
            <div className="room-actions">
              <button className={`tool-button${showGrid ? " is-active" : ""}`} onClick={() => setShowGrid((value) => !value)} aria-pressed={showGrid}>
                <span className="grid-icon" aria-hidden="true" /> {showGrid ? "Hide grid" : "Show grid"}
              </button>
              {selectedId && !hiddenIds.includes(selectedId) && (
                <div className="header-selection-tools" aria-label="Selected item controls">
                  <span>Selected</span>
                  <button onClick={() => resizeSelected(-.1)} aria-label="Make selected item smaller">−</button>
                  <button onClick={() => resizeSelected(.1)} aria-label="Make selected item larger">+</button>
                  {(selectedId.startsWith("memory-") || selectedId.startsWith("text-")) && <button onClick={beginTextEdit}>Edit</button>}
                  <button className="delete-control" onClick={deleteSelected}>Delete</button>
                  <button onClick={() => setSelectedId(null)}>Done</button>
                </div>
              )}
              <button className="tool-button" onClick={() => setSparkOpen(true)}><span aria-hidden="true">✦</span> Give me a word</button>
              <button className="tool-button tool-button--discover" onClick={discoverThreads} disabled={analyzing}>
                <span aria-hidden="true">◎</span> {analyzing ? "Noticing…" : currentAiThreads.length ? "Refresh threads" : "Discover threads"}
              </button>
              <button className="tool-button" onClick={addTextToRoom}><span aria-hidden="true">T</span> Add text</button>
              <button className="tool-button tool-button--primary" onClick={() => setView("drawer")}><span aria-hidden="true">+</span> Add a fragment</button>
            </div>
          </div>

          <div className="room-layout">
            <div className={roomClass}>
              <div className="zoom-controls" aria-label="Canvas zoom controls">
                <button onClick={() => setZoom((value) => Math.max(.45, Number((value - .1).toFixed(2))))} aria-label="Zoom out">−</button>
                <button className="zoom-value" onClick={() => setZoom(1)} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
                <button onClick={() => setZoom((value) => Math.min(1.6, Number((value + .1).toFixed(2))))} aria-label="Zoom in">+</button>
                <button className="zoom-fit" onClick={() => setZoom(.58)}>Fit</button>
              </div>
              <div className="room-stage-space" style={{ width: `${ROOM_WIDTH * zoom}px`, height: `${ROOM_HEIGHT * zoom}px` }}>
              <div className={`room-stage${showGrid ? " has-grid" : ""}`} style={{ transform: `scale(${zoom})` }}>
                <div className="canvas-zone canvas-zone--visual" aria-hidden="true">
                  <span>Visual field</span>
                  <small>images · references · works in progress</small>
                </div>
                <div className="canvas-zone canvas-zone--language" aria-hidden="true">
                  <span>Words &amp; voice</span>
                  <small>memories can move anywhere</small>
                </div>
                {currentRoom.isSample && memoryItems.map((note, index) => (
                  <span key={`line-${note.target}`} className="dynamic-connector" style={connectorStyle(index, note.target)} aria-hidden="true" />
                ))}
                {currentRoom.isSample && fragments.filter((fragment) => !hiddenIds.includes(fragment.id)).map((fragment) => (
                <figure
                  key={fragment.id}
                  className={`${fragment.className}${focusedFragment === fragment.id ? " is-focused" : ""}${focusedFragment && focusedFragment !== fragment.id ? " is-muted" : ""}`}
                  style={{ transform: itemTransform(fragment.id) }}
                  onPointerDown={(event) => startMove(event, fragment.id)}
                  onPointerMove={moveFragment}
                  onPointerUp={(event) => endMove(event, fragment.id)}
                  onPointerCancel={(event) => endMove(event, fragment.id)}
                >
                  <img src={fragment.src} alt={fragment.alt} />
                  <figcaption>{fragment.date}</figcaption>
                </figure>
                ))}
                {roomImages.filter((image) => !hiddenIds.includes(image.id)).map((image, index) => (
                <figure
                  key={image.id}
                  className="fragment fragment--captured"
                  style={{
                    left: `${210 + (index % 4) * 330}px`,
                    top: `${180 + (index % 3) * 290}px`,
                    width: `${image.width >= image.height ? 300 : 190}px`,
                    transform: itemTransform(image.id),
                    zIndex: 5 + index,
                  }}
                  onPointerDown={(event) => startMove(event, image.id)}
                  onPointerMove={moveFragment}
                  onPointerUp={(event) => endMove(event, image.id)}
                  onPointerCancel={(event) => endMove(event, image.id)}
                >
                  <img src={image.src} alt={image.name} />
                  <figcaption>{image.date} · yours</figcaption>
                  {image.note && <p className="captured-note">“{image.note}”</p>}
                </figure>
                ))}

                {roomTexts.filter((text) => !hiddenIds.includes(text.id)).map((text, index) => {
                  const id = text.id;
                  return (
                    <button
                      key={id}
                      className="memory-fragment memory-fragment--new"
                      style={{
                        left: `${350 + (index % 3) * 300}px`,
                        top: `${380 + (index % 2) * 190}px`,
                        transform: itemTransform(id),
                      }}
                      onPointerDown={(event) => startMove(event, id)}
                      onPointerMove={moveFragment}
                      onPointerUp={(event) => endMove(event, id)}
                      onPointerCancel={(event) => endMove(event, id)}
                    >
                      <small>{text.date}</small>
                      <span>“{text.text}”</span>
                    </button>
                  );
                })}

                {roomAudios.filter((audio) => !hiddenIds.includes(audio.id)).map((audio, index) => (
                  <article
                    key={audio.id}
                    className="audio-fragment"
                    style={{
                      left: `${760 + (index % 3) * 310}px`,
                      top: `${530 + (index % 2) * 230}px`,
                      transform: itemTransform(audio.id),
                    }}
                    onPointerDown={(event) => startMove(event, audio.id)}
                    onPointerMove={moveFragment}
                    onPointerUp={(event) => endMove(event, audio.id)}
                    onPointerCancel={(event) => endMove(event, audio.id)}
                  >
                    <small>{audio.date}</small>
                    <strong>Voice note · {formatDuration(audio.duration)}</strong>
                    <audio controls src={audio.src} onPointerDown={(event) => event.stopPropagation()} />
                    {audio.transcript && <p className="audio-transcript">“{audio.transcript}”</p>}
                  </article>
                ))}

                {currentRoom.isSample && memoryItems.map((note, index) => {
                  const id = `memory-${index}`;
                  if (hiddenIds.includes(id)) return null;
                  return (
                    <button
                      key={id}
                      className={`memory-fragment${focusedFragment === note.target ? " is-active" : ""}`}
                      style={{
                        left: `${memoryHomes[index].x - 115}px`,
                        top: `${memoryHomes[index].y - 65}px`,
                        transform: itemTransform(id),
                      }}
                      onClick={() => setFocusedFragment(focusedFragment === note.target ? null : note.target)}
                      onPointerDown={(event) => startMove(event, id)}
                      onPointerMove={moveFragment}
                      onPointerUp={(event) => endMove(event, id)}
                      onPointerCancel={(event) => endMove(event, id)}
                    >
                      <small>{note.date}</small>
                      <span>“{note.text}”</span>
                    </button>
                  );
                })}

                {currentRoom.isSample && <button
                className={`living-thread${threadState !== "idle" ? " is-open" : ""}`}
                onClick={() => setThreadState(threadState === "idle" ? "evidence" : "idle")}
                aria-expanded={threadState !== "idle"}
              >
                <span className="thread-pulse" />
                <span><strong>Thresholds</strong><small>7 fragments across 18 days</small></span>
                </button>}

                {currentRoom.isSample && threadState !== "idle" && (
                <aside className="thread-card">
                  <div className="thread-card-heading">
                    <p>Living Thread 01</p>
                    <button onClick={() => setThreadState("idle")} aria-label="Close thread">×</button>
                  </div>
                  <h2>Thresholds</h2>
                  <p className="thread-summary">A repeated attention to spaces that are open, but not fully available.</p>
                  <dl className="evidence-list">
                    <div><dt>Visual</dt><dd>Blocked entrances, narrow passages, frames within frames.</dd></div>
                    <div><dt>Language</dt><dd>“Between,” “not fully inside,” “almost entering.”</dd></div>
                    <div><dt>Time</dt><dd>7 fragments collected across 18 days.</dd></div>
                  </dl>
                  <blockquote>“I keep photographing places that look like they are waiting for someone to cross.”<cite>Voice note · June 12</cite></blockquote>
                  <div className="thread-feedback">
                    <span>Does this feel true?</span>
                    <button className={threadState === "accepted" ? "is-selected" : ""} onClick={() => setThreadState("accepted")}>It does</button>
                    <button className={threadState === "rejected" ? "is-selected" : ""} onClick={() => setThreadState("rejected")}>Not really</button>
                  </div>
                  <button className="return-button" onClick={() => setSparkOpen(true)}>Return to this thread <span>→</span></button>
                </aside>
                )}

                {currentAiThreads.map((thread, index) => (
                  <button
                    key={`ai-${thread.id}`}
                    className={`living-thread living-thread--generated${activeAiThreadId === thread.id ? " is-open" : ""}`}
                    style={{ left: `${1650 + index * 330}px`, top: "920px" }}
                    onClick={() => setActiveAiThreadId(activeAiThreadId === thread.id ? null : thread.id)}
                  >
                    <span className="thread-pulse" />
                    <span><strong>{thread.title}</strong><small>{thread.fragmentIds.length} connected fragments · GPT-5.6</small></span>
                  </button>
                ))}

                {activeAiThread && (
                  <aside className="thread-card thread-card--generated">
                    <div className="thread-card-heading">
                      <p>Living Thread · GPT-5.6</p>
                      <button onClick={() => setActiveAiThreadId(null)} aria-label="Close thread">×</button>
                    </div>
                    <h2>{activeAiThread.title}</h2>
                    <p className="thread-summary">{activeAiThread.summary}</p>
                    <dl className="evidence-list">
                      <div><dt>Visual</dt><dd>{activeAiThread.visualEvidence.join(" · ") || "No visual evidence cited."}</dd></div>
                      <div><dt>Language</dt><dd>{activeAiThread.languageEvidence.join(" · ") || "No language evidence cited."}</dd></div>
                      <div><dt>Time</dt><dd>{activeAiThread.timeEvidence}</dd></div>
                    </dl>
                    <div className="thread-feedback">
                      <span>A hypothesis, not a conclusion.</span>
                      <button onClick={() => setRelationSignal("This thread feels true. Drawer will keep it close.")}>It does</button>
                      <button onClick={() => { setAiThreads((current) => ({ ...current, [currentRoomId]: currentAiThreads.filter((item) => item.id !== activeAiThread.id) })); setActiveAiThreadId(null); }}>Not really</button>
                    </div>
                    <button className="return-button" onClick={() => setSparkOpen(true)}>Return to this thread <span>→</span></button>
                  </aside>
                )}
              </div>
              </div>
              {analysisError && <div className="analysis-toast" role="status"><span>{analysisError}</span><button onClick={() => setAnalysisError("")} aria-label="Dismiss">×</button></div>}
              {relationSignal && <div className="relation-toast">{relationSignal}</div>}
            </div>
          </div>
        </section>
      )}

      {sparkOpen && (
        <div className="spark-backdrop" role="dialog" aria-modal="true" aria-labelledby="spark-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSparkOpen(false); }}>
          <button className="spark-close" onClick={() => setSparkOpen(false)} aria-label="Close">×</button>
          <div className="spark-content">
            <p className="eyebrow">Return to this thread</p>
            <h2 id="spark-title">{activeAiThread ? activeAiThread.spark : <>Make something<br /><em>that never fully opens.</em></>}</h2>
            <p>{activeAiThread ? <>Return to <strong>{activeAiThread.title}</strong>. Use this as an opening, not an instruction.</> : <>Begin with the oldest image in <strong>Thresholds</strong>. Respond with sound instead of another image.</>}</p>
            <div className="spark-source">
              <img src="/fragment-UN7-iS_79oE.jpg" alt="The oldest image in the Thresholds thread" />
              <span>June 12 · oldest fragment</span>
            </div>
            <button className="primary-button" onClick={() => { setSparkOpen(false); setView("drawer"); }}>Respond to this <span>→</span></button>
          </div>
        </div>
      )}

      {editingId && (
        <div className="edit-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <div className="edit-card">
            <p className="eyebrow" id="edit-title">Edit this fragment</p>
            <textarea autoFocus value={editValue} onChange={(event) => setEditValue(event.target.value)} placeholder="Leave an unfinished thought…" />
            <div><button className="text-button" onClick={() => setEditingId(null)}>Cancel</button><button className="primary-button" onClick={saveTextEdit}>Keep this text</button></div>
          </div>
        </div>
      )}

      {renamingRoom && (
        <div className="edit-backdrop" role="dialog" aria-modal="true" aria-labelledby="room-name-title">
          <div className="edit-card edit-card--name">
            <p className="eyebrow" id="room-name-title">Name this room</p>
            <input
              autoFocus
              value={roomNameDraft}
              onChange={(event) => setRoomNameDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") saveRoomName(); if (event.key === "Escape") setRenamingRoom(false); }}
              placeholder="Project or collection name"
              aria-label="Room name"
            />
            <div><button className="text-button" onClick={() => setRenamingRoom(false)}>Cancel</button><button className="primary-button" onClick={saveRoomName} disabled={!roomNameDraft.trim()}>Save name</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
