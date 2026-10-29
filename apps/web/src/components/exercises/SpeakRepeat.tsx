"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakButton, Word } from "../ui";
import type { ExerciseProps } from "./types";

/** Listen, record yourself, compare, and say how it went. No speech recognition yet. */
export function SpeakRepeat({ ex, ctx, locked, onChange }: ExerciseProps<"speak_repeat">) {
  const [rating, setRating] = useState<"good" | "retry" | null>(null);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const canRecord = typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices;

  useEffect(() => () => {
    if (clip) URL.revokeObjectURL(clip);
  }, [clip]);

  async function toggleRecord() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setClip(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
        setRecording(false);
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      setTimeout(() => rec.state === "recording" && rec.stop(), 10_000);
    } catch {
      setRecording(false);
    }
  }

  function rate(r: "good" | "retry") {
    setRating(r);
    onChange({ type: "speak_repeat", selfRating: r });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium">הקשיבו וחזרו בקול</h2>
      <div className="flex items-start gap-3">
        <SpeakButton text={ex.text} lang={ctx.speechLang} />
        <div className="flex flex-col gap-1">
          <Word text={ex.text} lang={ctx.target} className="text-3xl" />
          <span className="text-ink-soft">{ex.translation}</span>
        </div>
      </div>
      {canRecord && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={locked} onClick={toggleRecord} className={recording ? "btn bg-rose text-white" : "btn-quiet"}>
            {recording ? "עצירת הקלטה" : clip ? "הקלטה מחדש" : "הקליטו את עצמכם"}
          </button>
          {clip && <audio controls src={clip} className="h-11 max-w-full" />}
        </div>
      )}
      <fieldset className="flex flex-col gap-2" disabled={locked}>
        <legend className="mb-2 text-ink-soft">איך יצא?</legend>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="choice justify-center" aria-pressed={rating === "good"} onClick={() => rate("good")}>
            אמרתי נכון
          </button>
          <button type="button" className="choice justify-center" aria-pressed={rating === "retry"} onClick={() => rate("retry")}>
            צריך עוד תרגול
          </button>
        </div>
      </fieldset>
    </div>
  );
}
