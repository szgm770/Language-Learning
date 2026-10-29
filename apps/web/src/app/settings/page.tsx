"use client";

import { SCHEMA_VERSION, type SettingField, setting } from "@lingo/sync";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackLink, Screen } from "@/components/ui";
import { db } from "@/lib/db";
import { cloudEnabled } from "@/lib/env";
import { uuidv7 } from "@/lib/ids";
import { clearLocalData, getDeviceId, record, useLearner } from "@/lib/store";
import { currentUser } from "@/lib/firebase";
import { resolveMerge, signOut, syncNow, useSyncStatus } from "@/lib/sync-client";

function save(field: SettingField, value: string | number | boolean | null) {
  const now = Date.now();
  return record([{ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION, kind: "setting", field, value }]);
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onPick: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} className="choice min-h-11 w-auto px-4 text-base" onClick={() => onPick(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Account() {
  const status = useSyncStatus();
  const [email, setEmail] = useState<string | null>(null);
  const [clearOnSignOut, setClearOnSignOut] = useState(false);
  useEffect(() => {
    void currentUser().then((u) => setEmail(u?.email ?? null));
  }, [status.kind]);

  if (!cloudEnabled) {
    return <p className="text-ink-soft">ההתקדמות נשמרת במכשיר הזה. סנכרון בין מכשירים יופעל בקרוב.</p>;
  }
  if (!email) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-ink-soft">ההתקדמות נשמרת רק במכשיר הזה. התחברו כדי לגבות אותה ולהמשיך ממכשירים אחרים.</p>
        <Link href="/login" className="btn-primary">
          התחברות או הרשמה
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p>
        מחוברים בתור <bdi className="font-medium">{email}</bdi>
      </p>
      {status.kind === "needs-merge" && (
        <div className="flex flex-col gap-3 rounded-xl bg-saffron-soft p-4">
          <p>במכשיר הזה יש התקדמות שלא נשמרה בחשבון ({status.localCount} פעולות). לצרף אותה לחשבון?</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => resolveMerge("merge")}>
              לצרף לחשבון
            </button>
            <button className="btn-quiet" onClick={() => resolveMerge("cloud-only")}>
              להשאיר רק את מה שבחשבון
            </button>
          </div>
        </div>
      )}
      <p className="text-sm text-ink-soft" role="status">
        {status.kind === "idle" && (status.pending ? `${status.pending} פעולות ממתינות לשליחה` : "הכל מסונכרן")}
        {status.kind === "syncing" && "מסנכרן…"}
        {status.kind === "offline" && "אין חיבור לאינטרנט. ההתקדמות נשמרת במכשיר ותישלח כשיחזור החיבור."}
        {status.kind === "error" && `הסנכרון נכשל: ${status.message}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-quiet" onClick={() => syncNow()}>
          לסנכרן עכשיו
        </button>
        <button className="btn-quiet" onClick={() => signOut(clearOnSignOut)}>
          התנתקות
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-5" checked={clearOnSignOut} onChange={(e) => setClearOnSignOut(e.target.checked)} />
        למחוק את הנתונים מהמכשיר הזה בהתנתקות (החשבון לא נפגע)
      </label>
    </div>
  );
}

export default function Settings() {
  const { state } = useLearner();
  const theme = setting(state, "theme", "system");
  const goal = setting(state, "dailyGoalMinutes", 10);
  const newPerDay = setting(state, "newPerDay", 10);
  const [confirmClear, setConfirmClear] = useState(false);

  async function exportData() {
    const ops = await db().ops.toArray();
    const blob = new Blob([JSON.stringify(ops.map((o) => o.op), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-learning-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Screen className="gap-10 pt-2">
      <BackLink href="/" />
      <h1 className="text-3xl font-semibold">הגדרות</h1>

      <section className="flex flex-col gap-6">
        <Segmented
          label="יעד יומי"
          value={goal}
          options={[5, 10, 15, 20].map((m) => ({ value: m, label: `${m} דקות` }))}
          onPick={(v) => save("dailyGoalMinutes", v)}
        />
        <Segmented
          label="מילים חדשות ביום"
          value={newPerDay}
          options={[5, 10, 15, 20].map((m) => ({ value: m, label: String(m) }))}
          onPick={(v) => save("newPerDay", v)}
        />
        <Segmented
          label="מראה"
          value={theme as string}
          options={[
            { value: "system", label: "כמו במכשיר" },
            { value: "light", label: "בהיר" },
            { value: "dark", label: "כהה" },
          ]}
          onPick={(v) => save("theme", v)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">חשבון וגיבוי</h2>
        <Account />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">הנתונים שלי</h2>
        <button className="btn-quiet self-start" onClick={exportData}>
          הורדת כל הנתונים (JSON)
        </button>
        {!confirmClear ? (
          <button className="btn-quiet self-start text-rose" onClick={() => setConfirmClear(true)}>
            מחיקת הנתונים מהמכשיר הזה
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-rose-soft p-4">
            <p>זה מוחק את ההתקדמות מהמכשיר הזה בלבד. מה שכבר נשמר בחשבון נשאר, ויחזור בהתחברות הבאה. התקדמות שלא סונכרנה תימחק.</p>
            <div className="flex gap-2">
              <button
                className="btn bg-rose text-white"
                onClick={async () => {
                  await clearLocalData();
                  location.href = "/";
                }}
              >
                למחוק מהמכשיר
              </button>
              <button className="btn-quiet" onClick={() => setConfirmClear(false)}>
                ביטול
              </button>
            </div>
          </div>
        )}
      </section>
    </Screen>
  );
}
