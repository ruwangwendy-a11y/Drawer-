"use client";

import { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type View = "landing" | "drawer" | "room";
type ThreadState = "idle" | "evidence" | "accepted" | "rejected";
type CapturedImage = { id: string; src: string; name: string; note: string; date: string; width: number; height: number; roomId?: string };
type CapturedText = { id: string; text: string; date: string; roomId: string };
type CapturedAudio = { id: string; src: string; date: string; duration: number; roomId: string; transcript?: string };
type Point = { x: number; y: number };
type AiEvidence = { fragmentId: string; modality: "image" | "text" | "audio"; observation: string };
type AiThread = {
  id: string;
  title: string;
  dimensions?: string[];
  stage?: "seed" | "emerging" | "recurring";
  observedPattern?: string;
  possibleInterpretation?: string;
  evidence?: AiEvidence[];
  summary?: string;
  visualEvidence?: string[];
  languageEvidence?: string[];
  timeEvidence: string;
  fragmentIds: string[];
  spark: string;
  feedback?: "accepted" | "rejected";
};
type RejectedInsight = { title: string; summary: string };
const ANALYSIS_VERSION = 5;
const THREAD_LAYOUT_VERSION = 3;

const fragmentHomes: Record<string, Point> = {
  corridor: { x: 270, y: 338 },
  subway: { x: 785, y: 301 },
  hall: { x: 1320, y: 378 },
  gate: { x: 833, y: 835 },
  reflectionOne: { x: 1790, y: 269 },
  reflectionTwo: { x: 2370, y: 256 },
  reflectionThree: { x: 1795, y: 752 },
  reflectionFour: { x: 2390, y: 748 },
  reflectionFive: { x: 1810, y: 1222 },
  shadowReflection: { x: 2430, y: 1255 },
  rainWindow: { x: 2080, y: 1749 },
};

const memoryHomes = [
  { x: 535, y: 350 },
  { x: 1030, y: 300 },
  { x: 1080, y: 840 },
  { x: 2075, y: 270 },
  { x: 2080, y: 750 },
  { x: 2120, y: 1230 },
  { x: 2700, y: 1260 },
  { x: 2450, y: 1750 },
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
    date: "April 07",
    className: "fragment fragment--subway",
  },
  {
    id: "hall",
    src: "/fragment-lldl9L5oYYA.jpg",
    alt: "A green corridor with repeated doorways",
    date: "May 03",
    className: "fragment fragment--hall",
  },
  {
    id: "gate",
    src: "/fragment-h2n05gBQT-M.jpg",
    alt: "A quiet subway entrance gate",
    date: "June 11",
    className: "fragment fragment--gate",
  },
  {
    id: "reflectionOne",
    src: "/sample-reflection-1846.jpg",
    alt: "Pedestrian signs multiplied in a dark glass reflection",
    date: "March 26 · reflection study 01",
    className: "fragment fragment--original-color fragment--reflection-one",
  },
  {
    id: "reflectionTwo",
    src: "/sample-reflection-1847.jpg",
    alt: "Bare trees reflected across a modern building facade",
    date: "April 19 · reflection study 02",
    className: "fragment fragment--original-color fragment--reflection-two",
  },
  {
    id: "reflectionThree",
    src: "/sample-reflection-1848.jpg",
    alt: "Empty theater seats seen through a reflective storefront window",
    date: "May 22 · reflection study 03",
    className: "fragment fragment--original-color fragment--reflection-three",
  },
  {
    id: "reflectionFour",
    src: "/sample-reflection-1849.jpg",
    alt: "A bright pedestrian sign in front of city buildings",
    date: "July 02 · reflection study 04",
    className: "fragment fragment--original-color fragment--reflection-four",
  },
  {
    id: "reflectionFive",
    src: "/sample-reflection-1870.jpg",
    alt: "A construction worker and street scene layered through glass reflections",
    date: "July 24 · reflection study 05",
    className: "fragment fragment--original-color fragment--reflection-five",
  },
  {
    id: "shadowReflection",
    src: "/sample-shadow-reflection.jpg",
    alt: "A pedestrian's shadow crossing a reflective glass facade",
    date: "August 18 · Sebastian Schuster / Unsplash",
    className: "fragment fragment--original-color fragment--shadow-reflection",
  },
  {
    id: "rainWindow",
    src: "/sample-rain-window.jpg",
    alt: "A silhouetted passenger beside a rain-covered city window",
    date: "September 06 · Frankie Cordoba / Unsplash",
    className: "fragment fragment--original-color fragment--rain-window",
  },
];

const memoryNotes = [
  {
    date: "June 12 · voice note",
    text: "I keep photographing places that look like they are waiting for someone to cross.",
    target: "corridor",
  },
  {
    date: "April 07 · voice note",
    text: "Not fully inside. Not outside either. Maybe that is the part I want to keep.",
    target: "subway",
  },
  {
    date: "June 11 · note",
    text: "A place can be open and still refuse you.",
    target: "gate",
  },
  {
    date: "March 26 · assignment note",
    text: "I thought I was photographing signs. The glass kept putting the viewer back into the picture.",
    target: "reflectionOne",
  },
  {
    date: "May 22 · assignment note",
    text: "The reflection is always there, but most of the time we look through it.",
    target: "reflectionThree",
  },
  {
    date: "July 24 · unfinished thought",
    text: "Maybe a window does not only show what is behind it. It also keeps what passes in front.",
    target: "reflectionFive",
  },
  {
    date: "August 18 · shadow study",
    text: "The shadow arrived before I noticed the person.",
    target: "shadowReflection",
  },
  {
    date: "September 06 · rain study",
    text: "Rain turns the window into a surface instead of a view.",
    target: "rainWindow",
  },
];

const ROOM_WIDTH = 3200;
const ROOM_HEIGHT = 2200;

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [threadState, setThreadState] = useState<ThreadState>("idle");
  const [focusedFragment, setFocusedFragment] = useState<string | null>(null);
  const [sparkOpen, setSparkOpen] = useState(false);
  const [sparkText, setSparkText] = useState("");
  const [sparkLoading, setSparkLoading] = useState(false);
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
  const [hoveredAiThreadId, setHoveredAiThreadId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisSnapshots, setAnalysisSnapshots] = useState<Record<string, string>>({});
  const [rejectedInsights, setRejectedInsights] = useState<Record<string, RejectedInsight[]>>({});
  const [lastRejected, setLastRejected] = useState<{ roomId: string; threadId: string; insight: RejectedInsight; previousSnapshot: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const roomCanvasRef = useRef<HTMLDivElement>(null);
  const viewportBeforeThread = useRef<{ left: number; top: number } | null>(null);
  const dragState = useRef<{ id: string; startX: number; startY: number; origin: Point; target: HTMLElement; moved: boolean } | null>(null);
  const suppressClick = useRef<string | null>(null);
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
    if (!activeAiThreadId) return;
    const showEverythingOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeThreadFocus();
    };
    window.addEventListener("keydown", showEverythingOnEscape);
    return () => window.removeEventListener("keydown", showEverythingOnEscape);
  }, [activeAiThreadId]);

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
          setAnalysisSnapshots(state.analysisSnapshots ?? {});
          setRejectedInsights(state.rejectedInsights ?? {});
          const restoredMemoryItems = state.memoryItems ?? [];
          const datedMemoryItems = restoredMemoryItems.map((saved: typeof memoryNotes[number]) => {
            const currentSampleNote = memoryNotes.find((note) => note.target === saved.target);
            return currentSampleNote ? { ...saved, date: currentSampleNote.date } : saved;
          });
          const newSampleNotes = memoryNotes.filter((note) => !datedMemoryItems.some((saved: typeof note) => saved.target === note.target));
          setMemoryItems(datedMemoryItems.length ? [...datedMemoryItems, ...newSampleNotes] : memoryNotes);
          const restoredPositions = state.positions ?? {};
          const samplePositionIds = new Set([
            ...fragments.map((fragment) => fragment.id),
            ...memoryNotes.map((_, index) => `memory-${index}`),
            ...(state.capturedImages ?? []).filter((item: CapturedImage) => (item.roomId ?? "sample") === "sample").map((item: CapturedImage) => item.id),
            ...(state.capturedTexts ?? []).filter((item: CapturedText) => item.roomId === "sample").map((item: CapturedText) => item.id),
            ...(state.capturedAudios ?? []).filter((item: CapturedAudio) => item.roomId === "sample").map((item: CapturedAudio) => item.id),
          ]);
          setPositions(state.threadLayoutVersion === THREAD_LAYOUT_VERSION
            ? restoredPositions
            : Object.fromEntries(Object.entries(restoredPositions).filter(([id]) => !id.startsWith("ai-thread-") && !samplePositionIds.has(id))));
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
        body: JSON.stringify({ capturedImages, capturedTexts, capturedAudios, aiThreads, analysisSnapshots, rejectedInsights, memoryItems, positions, scales, hiddenIds, rooms, currentRoomId, threadLayoutVersion: THREAD_LAYOUT_VERSION }),
      }).catch(() => undefined);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [hydrated, deviceId, capturedImages, capturedTexts, capturedAudios, aiThreads, analysisSnapshots, rejectedInsights, memoryItems, positions, scales, hiddenIds, rooms, currentRoomId]);

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
      moved: false,
    };
    setSelectedId(id);
    setDraggingId(id);
  }

  function moveFragment(event: ReactPointerEvent<HTMLElement>) {
    const active = dragState.current;
    if (!active) return;
    const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY);
    if (distance < 4 && !active.moved) return;
    active.moved = true;
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
    setDraggingId(null);
    if (!active.moved) return;
    suppressClick.current = id;
    window.setTimeout(() => { if (suppressClick.current === id) suppressClick.current = null; }, 0);
    setPositions((current) => ({ ...current, [id]: finalPosition }));
    const kind = id.startsWith("ai-thread-") ? "This Living Thread" : id.startsWith("memory-") ? "This memory" : id.startsWith("audio-") ? "This voice note" : id.startsWith("user-") ? "Your new fragment" : "This fragment";
    setRelationSignal(`${kind} was moved. Drawer will treat its new neighbors as a relationship signal.`);
    window.setTimeout(() => setRelationSignal(null), 3200);
  }

  function canvasItemCenter(id: string): Point | null {
    const stage = roomCanvasRef.current?.querySelector<HTMLElement>(".room-stage");
    const element = stage
      ? Array.from(stage.querySelectorAll<HTMLElement>("[data-canvas-id]")).find((item) => item.dataset.canvasId === id)
      : null;
    if (!element) return null;
    const offset = positions[id] ?? { x: 0, y: 0 };
    const scale = scales[id] ?? 1;
    return {
      x: element.offsetLeft + offset.x + element.offsetWidth * scale / 2,
      y: element.offsetTop + offset.y + element.offsetHeight * scale / 2,
    };
  }

  function visualHome(targetId: string): Point | null {
    const exactCenter = canvasItemCenter(targetId);
    if (exactCenter) return exactCenter;
    if (fragmentHomes[targetId]) return fragmentHomes[targetId];
    const imageIndex = roomImages.findIndex((item) => item.id === targetId);
    if (imageIndex >= 0) {
      const image = roomImages[imageIndex];
      const width = image.width >= image.height ? 300 : 190;
      const columns = currentRoom.isSample ? 5 : 4;
      const left = currentRoom.isSample ? 140 + (imageIndex % columns) * 590 : 210 + (imageIndex % columns) * 330;
      const top = currentRoom.isSample ? 2250 + Math.floor(imageIndex / columns) * 450 : 180 + Math.floor(imageIndex / columns) * 420;
      return { x: left + width / 2, y: top + 110 };
    }
    return null;
  }

  function sourceHome(targetId: string): Point | null {
    const visual = visualHome(targetId);
    if (visual) return visual;
    if (targetId.startsWith("memory-")) {
      const index = Number(targetId.split("-")[1]);
      return memoryHomes[index] ?? null;
    }
    const textIndex = roomTexts.findIndex((item) => item.id === targetId);
    if (textIndex >= 0) return { x: 465 + (textIndex % 3) * 300, y: 445 + (textIndex % 2) * 190 };
    const audioIndex = roomAudios.findIndex((item) => item.id === targetId);
    if (audioIndex >= 0) return { x: 890 + (audioIndex % 3) * 310, y: 610 + (audioIndex % 2) * 230 };
    return null;
  }

  function openThreadFocus(thread: AiThread) {
    const canvas = roomCanvasRef.current;
    if (!canvas) {
      setActiveAiThreadId(thread.id);
      return;
    }
    if (activeAiThreadId === thread.id) {
      closeThreadFocus();
      return;
    }
    if (!activeAiThreadId) viewportBeforeThread.current = { left: canvas.scrollLeft, top: canvas.scrollTop };
    setActiveAiThreadId(thread.id);
    const points = thread.fragmentIds.map(sourceHome).filter((point): point is Point => Boolean(point));
    const threadIndex = Math.max(0, visibleAiThreads.findIndex((item) => item.id === thread.id));
    const actualThread = actualThreadHome(thread, threadIndex);
    const card = threadCardHome(actualThread);
    const focusPoints = [...points, actualThread, { x: card.x + 235, y: card.y + 240 }];
    const centerX = focusPoints.reduce((sum, point) => sum + point.x, 0) / focusPoints.length;
    const centerY = focusPoints.reduce((sum, point) => sum + point.y, 0) / focusPoints.length;
    window.requestAnimationFrame(() => {
      canvas.scrollTo({
        left: Math.max(0, centerX * zoom - canvas.clientWidth / 2),
        top: Math.max(0, centerY * zoom - canvas.clientHeight / 2),
        behavior: "smooth",
      });
    });
  }

  function closeThreadFocus() {
    setActiveAiThreadId(null);
    const canvas = roomCanvasRef.current;
    const previous = viewportBeforeThread.current;
    if (canvas && previous) {
      window.requestAnimationFrame(() => canvas.scrollTo({ left: previous.left, top: previous.top, behavior: "smooth" }));
    }
    viewportBeforeThread.current = null;
  }

  function stepThread(direction: -1 | 1) {
    if (!activeAiThread || visibleAiThreads.length < 2) return;
    const nextIndex = (activeAiThreadIndex + direction + visibleAiThreads.length) % visibleAiThreads.length;
    openThreadFocus(visibleAiThreads[nextIndex]);
  }

  function canvasAreaIsFree(candidate: Point, width: number, height: number, padding = 26) {
    const stage = roomCanvasRef.current?.querySelector<HTMLElement>(".room-stage");
    if (!stage) return true;
    return Array.from(stage.querySelectorAll<HTMLElement>("[data-canvas-id]"))
      .filter((element) => !hiddenIds.includes(element.dataset.canvasId ?? ""))
      .every((element) => {
        const id = element.dataset.canvasId ?? "";
        const offset = positions[id] ?? { x: 0, y: 0 };
        const scale = scales[id] ?? 1;
        const left = element.offsetLeft + offset.x;
        const top = element.offsetTop + offset.y;
        const right = left + element.offsetWidth * scale;
        const bottom = top + element.offsetHeight * scale;
        return candidate.x + width + padding < left
          || candidate.x - padding > right
          || candidate.y + height + padding < top
          || candidate.y - padding > bottom;
      });
  }

  function threadHome(thread: AiThread, threadIndex: number): Point {
    const visualPoints = thread.fragmentIds
      .map((id) => visualHome(id))
      .filter((point): point is Point => Boolean(point));
    if (!visualPoints.length) return { x: 1650 + threadIndex * 330, y: 920 };
    // Anchor each Thread to the center of its own evidence cluster. The old
    // max-X rule pushed any Thread containing one distant image to the lower
    // right edge, separating both its button and explanation from the work.
    // A quiet shelf keeps generated Threads legible before the canvas DOM has
    // measured its images. Evidence remains spatially clear through the blue
    // connectors that appear only after a Thread is opened.
    return {
      x: 245 + (threadIndex % 4) * 720,
      y: 82 + Math.floor(threadIndex / 4) * 78,
    };
  }

  function actualThreadHome(thread: AiThread, threadIndex: number): Point {
    const home = threadHome(thread, threadIndex);
    const offset = positions[`ai-thread-${thread.id}`] ?? { x: 0, y: 0 };
    return { x: home.x + offset.x, y: home.y + offset.y };
  }

  function threadCardHome(threadPoint: Point): Point {
    // Keep the explanation physically attached to its Thread. Basing this on
    // the pre-focus viewport made distant Threads move into view while their
    // cards stayed behind, so their feedback controls appeared not to work.
    const candidates = [
      { x: threadPoint.x + 285, y: threadPoint.y - 45 },
      { x: threadPoint.x - 515, y: threadPoint.y - 45 },
      { x: threadPoint.x - 115, y: threadPoint.y + 95 },
      { x: threadPoint.x - 115, y: threadPoint.y - 665 },
    ].map((point) => ({
      x: Math.max(25, Math.min(ROOM_WIDTH - 500, point.x)),
      y: Math.max(35, Math.min(roomHeight - 640, point.y)),
    }));
    return candidates.find((candidate) => canvasAreaIsFree(candidate, 470, 610, 34)) ?? candidates[0];
  }

  function aiConnectorStyle(thread: AiThread, threadIndex: number, targetId: string) {
    const threadId = `ai-thread-${thread.id}`;
    const threadOffset = positions[threadId] ?? { x: 0, y: 0 };
    const home = threadHome(thread, threadIndex);
    const from = { x: home.x + 120 + threadOffset.x, y: home.y + 30 + threadOffset.y };
    const target = visualHome(targetId);
    if (!target) return { display: "none" };
    const to = target;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const connectorOpacity = Math.max(.3, .72 - distance / 3200);
    return {
      left: `${from.x}px`,
      top: `${from.y}px`,
      width: `${distance}px`,
      transform: `rotate(${Math.atan2(dy, dx)}rad)`,
      opacity: draggingId === threadId || draggingId === targetId ? 0 : connectorOpacity,
    };
  }

  function itemTransform(id: string) {
    const point = positions[id] ?? { x: 0, y: 0 };
    return `translate3d(${point.x}px, ${point.y}px, 0) scale(${scales[id] ?? 1})`;
  }

  function aiFocusClass(id: string) {
    const hoveredThread = visibleAiThreads.find((thread) => thread.id === hoveredAiThreadId);
    if (!activeAiThread) return hoveredThread?.fragmentIds.includes(id) ? " is-ai-preview" : "";
    return activeAiThread.fragmentIds.includes(id) ? " is-ai-related" : " is-ai-muted";
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
    closeThreadFocus();
    setThreadState("idle");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomName: currentRoom.name,
          images: [
            ...(currentRoom.isSample ? fragments.filter((item) => !hiddenIds.includes(item.id)).map(({ id, src, date, alt }) => ({ id, src, date, label: alt })) : []),
            ...roomImages.filter((item) => !hiddenIds.includes(item.id)).map(({ id, src, date, name }) => ({ id, src, date, label: name })),
          ],
          texts: [
            ...(currentRoom.isSample ? memoryItems.map((item, index) => ({ id: `memory-${index}`, text: item.text, date: item.date })) : []),
            ...roomTexts.filter((item) => !hiddenIds.includes(item.id)).map(({ id, text, date }) => ({ id, text, date })),
          ],
          audios: roomAudios.filter((item) => !hiddenIds.includes(item.id) && item.transcript).map(({ id, transcript, date }) => ({ id, transcript, date })),
          rejectedThreads: rejectedInsights[currentRoomId] ?? [],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Drawer could not find a thread yet");
      const threads = (result.threads ?? []) as AiThread[];
      setAiThreads((current) => ({ ...current, [currentRoomId]: threads }));
      setAnalysisSnapshots((current) => ({ ...current, [currentRoomId]: currentRoomSignature }));
      if (threads[0]) setActiveAiThreadId(threads[0].id);
      else setAnalysisError("No repeated thread was strong enough yet. Add another fragment and return later.");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Drawer could not find a thread yet");
    } finally {
      setAnalyzing(false);
    }
  }

  function keepThread(threadId: string) {
    setAiThreads((current) => ({
      ...current,
      [currentRoomId]: (current[currentRoomId] ?? []).map((thread) => thread.id === threadId ? { ...thread, feedback: "accepted" } : thread),
    }));
    setRelationSignal("Kept ✓ Drawer will remember this response and prefer this thread when you ask for a way back in.");
    window.setTimeout(() => setRelationSignal(null), 2600);
  }

  function rejectThread(thread: AiThread) {
    const insight = { title: thread.title, summary: thread.observedPattern ?? thread.summary ?? "" };
    setAiThreads((current) => ({
      ...current,
      [currentRoomId]: (current[currentRoomId] ?? []).map((item) => item.id === thread.id ? { ...item, feedback: "rejected" } : item),
    }));
    setRejectedInsights((current) => ({ ...current, [currentRoomId]: [...(current[currentRoomId] ?? []), insight] }));
    setLastRejected({ roomId: currentRoomId, threadId: thread.id, insight, previousSnapshot: analysisSnapshots[currentRoomId] ?? "" });
    setAnalysisSnapshots((current) => ({ ...current, [currentRoomId]: "" }));
    closeThreadFocus();
  }

  function undoReject() {
    if (!lastRejected) return;
    const { roomId, threadId, insight, previousSnapshot } = lastRejected;
    setAiThreads((current) => ({
      ...current,
      [roomId]: (current[roomId] ?? []).map((item) => item.id === threadId ? { ...item, feedback: undefined } : item),
    }));
    setRejectedInsights((current) => {
      const roomItems = [...(current[roomId] ?? [])];
      const index = roomItems.findLastIndex((item) => item.title === insight.title && item.summary === insight.summary);
      if (index >= 0) roomItems.splice(index, 1);
      return { ...current, [roomId]: roomItems };
    });
    setAnalysisSnapshots((current) => ({ ...current, [roomId]: previousSnapshot }));
    setActiveAiThreadId(threadId);
    setLastRejected(null);
  }

  async function openSpark() {
    const candidate = activeAiThread ?? visibleAiThreads.find((thread) => thread.feedback === "accepted") ?? visibleAiThreads[0];
    if (candidate) {
      setActiveAiThreadId(candidate.id);
      setSparkOpen(true);
      setSparkText("");
      setSparkLoading(true);
      try {
        const response = await fetch("/api/spark", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: candidate.title,
            observedPattern: candidate.observedPattern ?? candidate.summary,
            possibleInterpretation: candidate.possibleInterpretation ?? "",
            previousSpark: candidate.spark,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Drawer could not find a spark yet");
        setSparkText(result.spark);
      } catch {
        setSparkText(candidate.spark);
      } finally {
        setSparkLoading(false);
      }
      return;
    }
    if (currentRoom.isSample && !analysisSnapshots[currentRoomId]) {
      setSparkOpen(true);
      return;
    }
    setAnalysisError("Discover a Living Thread before asking Drawer for a way back in.");
  }

  const roomImages = capturedImages.filter((image) => (image.roomId ?? "sample") === currentRoomId);
  const roomTexts = capturedTexts.filter((text) => text.roomId === currentRoomId);
  const roomAudios = capturedAudios.filter((audio) => audio.roomId === currentRoomId);
  const recentColumns = currentRoom.isSample ? 5 : 4;
  const recentBaseY = currentRoom.isSample ? 2250 : 180;
  const recentImageRows = Math.max(1, Math.ceil(roomImages.length / recentColumns));
  const notesBaseY = currentRoom.isSample ? recentBaseY + recentImageRows * 450 : 720;
  const recentNoteCount = roomTexts.length + roomAudios.length;
  const roomHeight = currentRoom.isSample
    ? Math.max(2200, notesBaseY + Math.max(1, Math.ceil(recentNoteCount / 5)) * 340 + 180)
    : Math.max(2200, notesBaseY + Math.max(1, Math.ceil(recentNoteCount / 4)) * 340 + 220);
  const currentAiThreads = aiThreads[currentRoomId] ?? [];
  const visibleAiThreads = currentAiThreads.filter((thread) => thread.feedback !== "rejected");
  const activeAiThread = visibleAiThreads.find((thread) => thread.id === activeAiThreadId) ?? null;
  const activeAiThreadIndex = activeAiThread ? visibleAiThreads.findIndex((thread) => thread.id === activeAiThread.id) : -1;
  const activeThreadHome = activeAiThread ? actualThreadHome(activeAiThread, Math.max(0, activeAiThreadIndex)) : null;
  const activeThreadCardPosition = activeThreadHome ? threadCardHome(activeThreadHome) : null;
  const currentSourceIds = new Set([
    ...(currentRoom.isSample ? fragments.map((item) => item.id) : []),
    ...(currentRoom.isSample ? memoryItems.map((_, index) => `memory-${index}`) : []),
    ...roomImages.map((item) => item.id),
    ...roomTexts.map((item) => item.id),
    ...roomAudios.map((item) => item.id),
  ]);
  const currentRoomSignature = JSON.stringify({
    analysisVersion: ANALYSIS_VERSION,
    sampleImages: currentRoom.isSample ? fragments.filter((item) => !hiddenIds.includes(item.id)).map((item) => item.id) : [],
    sampleWords: currentRoom.isSample ? memoryItems.map((item) => item.text) : [],
    images: roomImages.filter((item) => !hiddenIds.includes(item.id)).map((item) => [item.id, item.src]),
    texts: roomTexts.filter((item) => !hiddenIds.includes(item.id)).map((item) => [item.id, item.text]),
    audios: roomAudios.filter((item) => !hiddenIds.includes(item.id)).map((item) => [item.id, item.transcript ?? ""]),
    positions: Object.fromEntries(Object.entries(positions).filter(([id]) => currentSourceIds.has(id))),
  });
  const hasAnalyzedRoom = Boolean(analysisSnapshots[currentRoomId]);
  const analysisNeedsUpgrade = hasAnalyzedRoom && !analysisSnapshots[currentRoomId].includes(`\"analysisVersion\":${ANALYSIS_VERSION}`);
  const roomChangedSinceAnalysis = hasAnalyzedRoom && analysisSnapshots[currentRoomId] !== currentRoomSignature;
  const shouldSeekDifferentConnection = !hasAnalyzedRoom && (rejectedInsights[currentRoomId]?.length ?? 0) > 0;
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
            <p className="eyebrow">Your creative memory</p>
            <h1 id="drawer-title">When an idea appears,<br /><em>give it somewhere to stay.</em></h1>
            <p className="memory-intro">Inspiration often arrives before it can explain itself. Leave the image, sound, or unfinished thought here. You can understand it later.</p>
            <p className="memory-growth"><strong>Every day, your creative memory grows.</strong> Each fragment keeps a little of the context around it. Over time, Drawer notices the ideas that keep returning—and brings them back when you need a way into your next piece of work.</p>
            {(pendingImages.length > 0 || recordedAudio || draft.trim()) && <p className="capture-live-status">A new part of your memory is ready to enter the Room.</p>}
          </div>
          <div className="drawer-shell">
            <div className="drawer-content">
              <div className="capture-promise" aria-label="How Drawer works">
                <span><b>01</b> Leave a fragment</span>
                <span><b>02</b> Close the drawer</span>
                <span><b>03</b> Meet it again</span>
              </div>
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
              <button className="tool-button" onClick={openSpark}><span aria-hidden="true">✦</span> Give me a spark</button>
              <button className="tool-button tool-button--discover" onClick={discoverThreads} disabled={analyzing || (hasAnalyzedRoom && !roomChangedSinceAnalysis)}>
                <span aria-hidden="true">◎</span> {analyzing ? "Noticing…" : shouldSeekDifferentConnection ? "Look for a different connection" : analysisNeedsUpgrade ? "New analysis available · Look again" : roomChangedSinceAnalysis ? "Room changed · Look again" : hasAnalyzedRoom ? "Threads are up to date" : "Discover threads"}
              </button>
              {activeAiThread && (
                <button className="tool-button tool-button--show-all" onClick={closeThreadFocus}>
                  <span aria-hidden="true">×</span> Show all
                </button>
              )}
              <button className="tool-button" onClick={addTextToRoom}><span aria-hidden="true">T</span> Add text</button>
              <button className="tool-button tool-button--primary" onClick={() => setView("drawer")}><span aria-hidden="true">+</span> Add a fragment</button>
            </div>
          </div>

          <div className="room-layout">
            <div ref={roomCanvasRef} className={roomClass}>
              <div className="zoom-controls" aria-label="Canvas zoom controls">
                <button onClick={() => setZoom((value) => Math.max(.45, Number((value - .1).toFixed(2))))} aria-label="Zoom out">−</button>
                <button className="zoom-value" onClick={() => setZoom(1)} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
                <button onClick={() => setZoom((value) => Math.min(1.6, Number((value + .1).toFixed(2))))} aria-label="Zoom in">+</button>
                <button className="zoom-fit" onClick={() => setZoom(.58)}>Fit</button>
              </div>
              <div className="room-stage-space" style={{ width: `${ROOM_WIDTH * zoom}px`, height: `${roomHeight * zoom}px` }}>
              <div className={`room-stage${showGrid ? " has-grid" : ""}`} style={{ transform: `scale(${zoom})`, height: `${roomHeight}px` }}>
                <div className="canvas-guide" aria-label="Canvas guide">
                  <span>Move anything to arrange your thinking.</span>
                  <span>Open a Living Thread to reveal its evidence.</span>
                  <span>Dimmed fragments stay here—they are simply outside this connection.</span>
                </div>
                <div className="canvas-zone canvas-zone--visual" aria-hidden="true">
                  <span>Visual field</span>
                  <small>images · references · works in progress</small>
                </div>
                <div className="canvas-zone canvas-zone--language" aria-hidden="true">
                  <span>Words &amp; voice</span>
                  <small>memories can move anywhere</small>
                </div>
                {currentRoom.isSample && fragments.filter((fragment) => !hiddenIds.includes(fragment.id)).map((fragment) => (
                <figure
                  key={fragment.id}
                  data-canvas-id={fragment.id}
                  className={`${fragment.className}${focusedFragment === fragment.id ? " is-focused" : ""}${focusedFragment && focusedFragment !== fragment.id ? " is-muted" : ""}${aiFocusClass(fragment.id)}`}
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
                  data-canvas-id={image.id}
                  className={`fragment fragment--captured${aiFocusClass(image.id)}`}
                  style={{
                    left: `${currentRoom.isSample ? 140 + (index % recentColumns) * 590 : 210 + (index % recentColumns) * 330}px`,
                    top: `${recentBaseY + Math.floor(index / recentColumns) * (currentRoom.isSample ? 450 : 420)}px`,
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
                      data-canvas-id={id}
                      className={`memory-fragment memory-fragment--new${aiFocusClass(id)}`}
                      style={{
                        left: `${currentRoom.isSample ? 140 + (index % 5) * 590 : 160 + (index % 4) * 650}px`,
                        top: `${notesBaseY + Math.floor(index / (currentRoom.isSample ? 5 : 4)) * 340}px`,
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
                    data-canvas-id={audio.id}
                    className={`audio-fragment${aiFocusClass(audio.id)}`}
                    style={{
                      left: `${currentRoom.isSample ? 420 + (index % 5) * 590 : 440 + (index % 4) * 650}px`,
                      top: `${notesBaseY + Math.floor((roomTexts.length + index) / (currentRoom.isSample ? 5 : 4)) * 340}px`,
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
                      data-canvas-id={id}
                      className={`memory-fragment${focusedFragment === note.target ? " is-active" : ""}${aiFocusClass(id)}`}
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

                {currentRoom.isSample && !currentAiThreads.length && <button
                className={`living-thread${threadState !== "idle" ? " is-open" : ""}`}
                onClick={() => setThreadState(threadState === "idle" ? "evidence" : "idle")}
                aria-expanded={threadState !== "idle"}
              >
                <span className="thread-pulse" />
                <span><strong>Thresholds</strong><small>7 fragments across 18 days</small></span>
                </button>}

                {currentRoom.isSample && !currentAiThreads.length && threadState !== "idle" && (
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

                {activeAiThread && visibleAiThreads.map((thread, threadIndex) => thread.id === activeAiThread.id
                  ? thread.fragmentIds.map((targetId) => (
                    <span key={`ai-line-${thread.id}-${targetId}`} data-thread-id={thread.id} data-target-id={targetId} className="ai-thread-connector" style={aiConnectorStyle(thread, threadIndex, targetId)} aria-hidden="true" />
                  ))
                  : null)}

                {visibleAiThreads.map((thread, index) => (
                  (() => {
                  const home = threadHome(thread, index);
                  return (
                  <button
                    key={`ai-${thread.id}`}
                    data-thread-id={thread.id}
                    className={`living-thread living-thread--generated${activeAiThreadId === thread.id ? " is-open" : ""}${activeAiThread && activeAiThreadId !== thread.id ? " is-ai-muted" : ""}`}
                    aria-expanded={activeAiThreadId === thread.id}
                    style={{ left: `${home.x}px`, top: `${home.y}px`, transform: itemTransform(`ai-thread-${thread.id}`) }}
                    onClick={() => {
                      const dragId = `ai-thread-${thread.id}`;
                      if (suppressClick.current === dragId) return;
                      openThreadFocus(thread);
                    }}
                    onPointerDown={(event) => startMove(event, `ai-thread-${thread.id}`)}
                    onPointerMove={moveFragment}
                    onPointerUp={(event) => endMove(event, `ai-thread-${thread.id}`)}
                    onPointerCancel={(event) => endMove(event, `ai-thread-${thread.id}`)}
                    onMouseEnter={() => setHoveredAiThreadId(thread.id)}
                    onMouseLeave={() => setHoveredAiThreadId(null)}
                  >
                    <span className="thread-pulse" />
                    <span><strong>{thread.title}</strong><small>{thread.stage ?? "emerging"} · {thread.fragmentIds.length} fragments · GPT-5.6</small></span>
                  </button>
                  );
                  })()
                ))}

                {activeAiThread && (
                  <aside className="thread-card thread-card--generated" style={activeThreadCardPosition ? { left: `${activeThreadCardPosition.x}px`, top: `${activeThreadCardPosition.y}px` } : undefined}>
                    <div className="thread-card-heading">
                      <p>Living Thread · GPT-5.6</p>
                      <div className="thread-card-nav" aria-label="Living Thread navigation">
                        <button onClick={() => stepThread(-1)} disabled={visibleAiThreads.length < 2} aria-label="Previous thread">←</button>
                        <span>{activeAiThreadIndex + 1} / {visibleAiThreads.length}</span>
                        <button onClick={() => stepThread(1)} disabled={visibleAiThreads.length < 2} aria-label="Next thread">→</button>
                        <button onClick={closeThreadFocus} aria-label="Close thread">×</button>
                      </div>
                    </div>
                    <h2>{activeAiThread.title}</h2>
                    <div className="thread-meta">
                      <span className={`thread-stage thread-stage--${activeAiThread.stage ?? "emerging"}`}>{activeAiThread.stage ?? "emerging"}</span>
                      {(activeAiThread.dimensions ?? ["visual pattern"]).map((dimension) => <span key={dimension}>{dimension}</span>)}
                    </div>
                    <section className="thread-reading">
                      <p className="thread-section-label">Observed in your archive</p>
                      <p className="thread-summary">{activeAiThread.observedPattern ?? activeAiThread.summary}</p>
                      {activeAiThread.possibleInterpretation && <><p className="thread-section-label">A possible interpretation</p><p className="thread-interpretation">{activeAiThread.possibleInterpretation}</p></>}
                    </section>
                    <dl className="evidence-list">
                      {(activeAiThread.evidence ?? []).map((item, index) => <div key={`${item.fragmentId}-${index}`}><dt>{item.modality}</dt><dd><span className="evidence-source">{item.fragmentId}</span>{item.observation}</dd></div>)}
                      {!activeAiThread.evidence?.length && <>
                        <div><dt>Visual</dt><dd>{activeAiThread.visualEvidence?.join(" · ") || "Repeated visual evidence across this room."}</dd></div>
                        {!!activeAiThread.languageEvidence?.length && <div><dt>Language</dt><dd>{activeAiThread.languageEvidence.join(" · ")}</dd></div>}
                      </>}
                      <div><dt>Time</dt><dd>{activeAiThread.timeEvidence}</dd></div>
                    </dl>
                    <div className="thread-feedback">
                      <span>A hypothesis, not a conclusion.</span>
                      <button className={activeAiThread.feedback === "accepted" ? "is-selected" : ""} onClick={() => keepThread(activeAiThread.id)}>{activeAiThread.feedback === "accepted" ? "Kept ✓" : "It does"}</button>
                      <button onClick={() => rejectThread(activeAiThread)}>Not really</button>
                    </div>
                    <button className="return-button" onClick={openSpark}>Return to this thread <span>→</span></button>
                  </aside>
                )}
              </div>
              </div>
              {analysisError && <div className="analysis-toast" role="status"><span>{analysisError}</span><button onClick={() => setAnalysisError("")} aria-label="Dismiss">×</button></div>}
              {lastRejected && <div className="reject-toast" role="status"><span>Thread hidden. Your fragments are untouched.</span><button onClick={undoReject}>Undo</button><button onClick={() => setLastRejected(null)} aria-label="Dismiss">×</button></div>}
              {relationSignal && <div className="relation-toast">{relationSignal}</div>}
            </div>
          </div>
        </section>
      )}

      {sparkOpen && (
        <div className="spark-backdrop" role="dialog" aria-modal="true" aria-labelledby="spark-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSparkOpen(false); }}>
          <button className="spark-close" onClick={() => setSparkOpen(false)} aria-label="Close">×</button>
          <div className="spark-content">
            <p className="eyebrow">{activeAiThread ? <>From · {activeAiThread.title}</> : "A small way in"}</p>
            <h2 id="spark-title" className={sparkLoading ? "is-loading" : ""}>{sparkLoading ? "Listening…" : activeAiThread ? (sparkText || activeAiThread.spark) : <>Almost<br /><em>through.</em></>}</h2>
            <p>{activeAiThread ? "Keep it, ignore it, or let it become something else." : "Only a beginning. The rest stays yours."}</p>
            <div className="spark-source">
              <img src="/fragment-UN7-iS_79oE.jpg" alt="The oldest image in the Thresholds thread" />
              <span>June 12 · oldest fragment</span>
            </div>
            <button className="primary-button" onClick={() => setSparkOpen(false)}>Back to the room <span>→</span></button>
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
