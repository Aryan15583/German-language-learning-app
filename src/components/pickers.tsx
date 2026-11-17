import { Lock } from "lucide-react";
import { LANGS, LEVELS, type Lang, type LevelId } from "../core/content/levels";
import { cx } from "./ui";

/** A1 … C2 pills; levels above `unlocked` show a little lock. */
export function LevelPicker({ value, unlocked = LEVELS.length, onChange }: { value: LevelId; unlocked?: number; onChange: (id: LevelId) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Level">
      {LEVELS.map((l, i) => {
        const on = l.id === value;
        const locked = i > unlocked;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`Level ${l.id}${locked ? ", locked" : ""}`}
            onClick={() => onChange(l.id)}
            className={cx(
              "flex flex-col items-center rounded-2xl border py-2 text-sm font-extrabold transition",
              on ? "border-plum bg-plum text-white shadow-soft" : "border-line bg-white/70 text-ink hover:border-rose",
            )}
          >
            {l.id}
            {locked ? <Lock size={11} className="mt-0.5 opacity-70" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function LangPicker({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Learn German through">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={value === l.id}
          onClick={() => onChange(l.id)}
          className={cx(
            "rounded-full border px-4 py-2 text-sm font-medium transition",
            value === l.id ? "border-plum bg-plum text-white" : "border-line bg-white/70 text-ink hover:border-rose",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
