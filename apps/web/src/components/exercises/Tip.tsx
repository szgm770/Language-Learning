import { Icon } from "../icons";
import type { ExerciseProps } from "./types";

/** A short note between exercises: culture, pronunciation or usage. */
export function Tip({ ex }: ExerciseProps<"tip">) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber">
        <Icon name="bulb" className="size-5" />
        כדאי לדעת
      </div>
      <div className="card flex flex-col gap-3 border-s-8 border-saffron p-6">
        <h2 className="text-2xl font-bold">{ex.title}</h2>
        {ex.text.split(/\n\s*\n/).map((p, i) => (
          <p key={i} className="text-lg leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
