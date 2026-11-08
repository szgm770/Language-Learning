"use client";

import { Op } from "@lingo/sync";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { z } from "zod";
import { loadCourse, loadCourses, type UnitPack, useLoad } from "@/lib/content";
import { levelInfo } from "@/lib/levels";
import { currentCourse } from "@/lib/progress";
import type { CourseManifest } from "@lingo/content-schema";
import { getDeviceId, ingest, record, useLearner } from "@/lib/store";
import { currentPosition, encodePosition, type Position, parsePosition, planPosition } from "@/lib/transfer";
import { newOpBase } from "@/lib/store";
import { flatLessons } from "@/lib/content";

type Mode = "show" | "scan" | "paste" | "manual" | null;

/** A QR code as an inline SVG: black on white, with a quiet zone, readable in dark mode too. */
function Qr({ text }: { text: string }) {
  const svg = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 6, margin: 4, scalable: true });
  }, [text]);
  return (
    <div
      role="img"
      aria-label="קוד QR עם מקום ההתקדמות שלכם"
      className="size-64 max-w-full self-center rounded-2xl bg-white p-2 [&>svg]:size-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Camera scanner: the browser's own QR detector when it has one, jsQR otherwise. */
function Scanner({ onCode, onFail }: { onCode: (text: string) => void; onFail: (why: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    let stop = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera api");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const v = video.current;
        if (!v || stop) return;
        v.srcObject = stream;
        await v.play();
        const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => { detect(v: HTMLVideoElement): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
        const jsQR = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const tick = async () => {
          if (stop) return;
          let text: string | undefined;
          try {
            if (v.readyState >= 2 && v.videoWidth) {
              if (detector) text = (await detector.detect(v))[0]?.rawValue;
              else if (jsQR && ctx) {
                const w = Math.min(640, v.videoWidth);
                const h = Math.round((v.videoHeight * w) / v.videoWidth);
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(v, 0, 0, w, h);
                text = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data;
              }
            }
          } catch {
            // a frame that cannot be read: try the next one
          }
          if (text && parsePosition(text)) return onCode(text);
          timer = setTimeout(tick, 150);
        };
        void tick();
      } catch {
        if (!stop) onFail("אין גישה למצלמה. אפשר להדביק את הקוד או לבחור מקום ידנית.");
      }
    })();
    return () => {
      stop = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode, onFail]);
  return (
    <div className="flex flex-col gap-2">
      <video ref={video} muted playsInline className="aspect-square w-full max-w-sm self-center rounded-2xl bg-black object-cover" />
      <p className="text-center text-sm text-ink-soft">כוונו את המצלמה אל קוד ה־QR במכשיר הישן.</p>
    </div>
  );
}

const field = "min-h-11 w-full rounded-xl border-2 border-line bg-surface px-3 text-base";

export function TransferSection() {
  const { state } = useLearner();
  const { data: courses } = useLoad(loadCourses, []);
  // The course the code is for. On a new device nothing is enrolled yet, so the learner can pick any course.
  const [picked, setPicked] = useState<string | null>(null);
  const courseId = picked ?? currentCourse(state) ?? courses?.[0]?.id;
  const { data } = useLoad(() => (courseId ? loadCourse(courseId) : Promise.resolve(undefined)), [courseId]);
  const [mode, setMode] = useState<Mode>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string; next?: string } | null>(null);
  const [typed, setTyped] = useState("");

  const units = data?.units;
  const mine = courseId && units ? currentPosition(state, courseId, units) : null;
  const code = mine ? encodePosition(mine) : "";

  async function apply(pos: Position) {
    setMessage(null);
    let target: UnitPack[] | undefined = pos.courseId === courseId ? units : undefined;
    try {
      target ??= (await loadCourse(pos.courseId)).units;
    } catch {
      return setMessage({ tone: "bad", text: "הקוד הזה שייך לקורס שהאתר לא מכיר." });
    }
    const plan = planPosition(pos, state, target, getDeviceId());
    if (!plan.ok) return setMessage({ tone: "bad", text: "השיעור בקוד לא קיים בקורס. ייתכן שהקוד ישן מדי או שגוי." });
    const base = newOpBase();
    await record([...plan.ops, { ...base, kind: "setting", field: "currentCourse", value: pos.courseId }]);
    setMode(null);
    setMessage({
      tone: "ok",
      text: plan.newlyDone ? `ההתקדמות הועברה: ${plan.newlyDone} שיעורים סומנו כהושלמו. ממשיכים מ־` : "אתם כבר נמצאים במקום הזה או מעבר לו, ולכן לא השתנה כלום. המקום הנוכחי שלכם:",
      next: plan.next?.title,
    });
  }

  const onScanned = useCallback(
    (text: string) => {
      const pos = parsePosition(text);
      if (pos) void apply(pos);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, courseId, units],
  );
  const onScanFail = useCallback((why: string) => {
    setMode(null);
    setMessage({ tone: "bad", text: why });
  }, []);

  async function importFile(file: File) {
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const ops = z.array(Op).parse(raw);
      const added = await ingest(ops);
      setMessage({ tone: "ok", text: `הקובץ נטען: נוספו ${added} פעולות מההיסטוריה (שיעורים, חזרות ומילים).` });
    } catch {
      setMessage({ tone: "bad", text: "הקובץ לא נראה כמו קובץ הנתונים שהורדתם מהאתר." });
    }
  }

  const tab = (m: Exclude<Mode, null>, label: string) => (
    <button type="button" aria-pressed={mode === m} className="choice min-h-11 w-auto px-4 text-base" onClick={() => { setMessage(null); setMode(mode === m ? null : m); }}>
      {label}
    </button>
  );

  return (
    <section className="card flex flex-col gap-4 p-5" aria-labelledby="transfer-h">
      <h2 id="transfer-h" className="text-xl font-semibold">מעבר למכשיר אחר</h2>
      <p className="text-ink-soft">
        כדי להמשיך מאותו מקום בטלפון או במחשב אחר: הציגו קוד במכשיר הישן וסרקו אותו במכשיר החדש. אם אי אפשר לסרוק, אפשר להקליד את הקוד או לבחור את המקום ידנית.
      </p>
      <div className="flex flex-wrap gap-2">
        {tab("show", "הצגת הקוד שלי")}
        {tab("scan", "סריקת קוד")}
        {tab("paste", "הקלדת קוד")}
        {tab("manual", "בחירת מקום ידנית")}
      </div>

      {courses && courses.length > 1 && (mode === "show" || mode === "manual") && (
        <label className="flex flex-col gap-2">
          <span className="font-medium">קורס</span>
          <select className={field} value={courseId ?? ""} onChange={(e) => setPicked(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title.he}
              </option>
            ))}
          </select>
        </label>
      )}

      {mode === "show" &&
        (mine ? (
          <div className="rounded-2xl bg-sunken flex flex-col gap-3 p-4">
            <Qr text={code} />
            <p className="text-center text-sm text-ink-soft">פתחו באתר במכשיר החדש: הגדרות ← מעבר למכשיר אחר ← סריקת קוד.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <code dir="ltr" className="select-all rounded-lg bg-sunken px-3 py-2 text-sm" data-testid="transfer-code">{code}</code>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => navigator.clipboard?.writeText(code).then(() => setMessage({ tone: "ok", text: "הקוד הועתק." }), () => undefined)}
              >
                העתקה
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-sunken p-4">בקורס הזה עוד אין התקדמות להעביר. התחילו שיעור ראשון ואז חזרו לכאן.</p>
        ))}

      {mode === "scan" && <div className="rounded-2xl bg-sunken p-4"><Scanner onCode={onScanned} onFail={onScanFail} /></div>}

      {mode === "paste" && (
        <form
          className="flex flex-col gap-3 rounded-2xl bg-sunken p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const pos = parsePosition(typed);
            if (!pos) return setMessage({ tone: "bad", text: "הקוד לא תקין. הוא מתחיל ב־lingo1 ונראה כמו lingo1.en-for-he.u12-l3" });
            void apply(pos);
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="font-medium">הקוד מהמכשיר הישן</span>
            <input dir="ltr" className={field} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="lingo1.en-for-he.u12-l3" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </label>
          <button className="btn-primary self-start" type="submit">להעביר</button>
        </form>
      )}

      {mode === "manual" && (units && courseId ? <Manual key={courseId} courseId={courseId} units={units} stages={data?.manifest.stages} onPick={apply} /> : <p className="rounded-2xl bg-sunken p-4">טוענים את הקורס…</p>)}

      <div className="flex flex-col gap-2">
        <label className="btn-quiet cursor-pointer self-start">
          טעינת קובץ נתונים (JSON)
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); e.target.value = ""; }} />
        </label>
        <p className="text-sm text-ink-soft">הקוד מעביר את המקום בקורס. הקובץ מעביר גם את היסטוריית החזרות (הורידו אותו בהגדרות במכשיר הישן).</p>
      </div>

      {message && (
        <div role="status" className={`rounded-xl p-4 ${message.tone === "ok" ? "bg-mint-soft" : "bg-rose-soft"}`}>
          {message.text} {message.next && <strong>{message.next}</strong>}
          {message.next && (
            <div className="mt-3"><Link href="/learn/" className="btn-primary">להמשיך ללמוד</Link></div>
          )}
        </div>
      )}
    </section>
  );
}

/** Pick a unit and a lesson: everything before it is marked as done. */
function Manual({ courseId, units, stages, onPick }: { courseId: string; units: UnitPack[]; stages?: CourseManifest["stages"]; onPick: (p: Position) => void }) {
  const { state } = useLearner();
  const here = currentPosition(state, courseId, units);
  const all = useMemo(() => flatLessons(units), [units]);
  const startUnit = units.findIndex((u) => u.lessons.some((l) => l.id === here?.lessonId));
  const [ui, setUi] = useState(Math.max(0, startUnit));
  const unit = units[ui]!;
  const options = unit.lessons;
  const [li, setLi] = useState(Math.max(0, options.findIndex((l) => l.id === here?.lessonId)));
  const lesson = options[Math.min(li, options.length - 1)]!;
  const target = all.findIndex((x) => x.lesson.id === lesson.id);
  const passed = all.filter(({ lesson: l }, i) => l.kind === "test" && i < target && (state.lessons.get(`${courseId}/${l.id}`)?.bestScore ?? 0) >= 0.7).map(({ lesson: l }) => l.id);
  const pos: Position = { courseId, lessonId: lesson.id, passed };
  const preview = planPosition(pos, state, units, getDeviceId());

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-sunken p-4">
      <p>בחרו את השיעור שממנו רוצים להמשיך. כל מה שלפניו יסומן כהושלם. התקדמות שכבר יש לכם לא נמחקת.</p>
      <label className="flex flex-col gap-2">
        <span className="font-medium">יחידה</span>
        <select className={field} value={ui} onChange={(e) => { setUi(Number(e.target.value)); setLi(0); }}>
          {units.map((u, i) => (
            <option key={u.id} value={i}>
              {levelInfo({ stages }, u.cefr).short} · {i + 1}. {u.title.he}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-medium">שיעור</span>
        <select className={field} value={li} onChange={(e) => setLi(Number(e.target.value))}>
          {options.map((l, i) => (
            <option key={l.id} value={i}>
              {i + 1}. {l.title.he}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-ink-soft">
        {preview.newlyDone ? `יסומנו ${preview.newlyDone} שיעורים חדשים כהושלמו.` : "לא יסומנו שיעורים חדשים. אתם כבר במקום הזה או מעבר לו."}
      </p>
      <button type="button" className="btn-primary self-start" onClick={() => onPick(pos)}>
        להמשיך מכאן
      </button>
    </div>
  );
}
