import { useMemo, useRef, useState } from "react";
import type { Lang } from "../core/content/levels";
import { answerPoints, duelInfo, duelQuestions, duelSentences, STREAK_LIVES } from "../core/lib/duels";
import { seededRng } from "../core/lib/util";
import { Quiz } from "./Quiz";
import { SentenceBuilder } from "./SentenceBuilder";

/** Plays one person's turn of any duel type and reports their score. Same raw topic + seed = same game. */
export function DuelRun({ raw, seed, lang, label, color, onFinish }: { raw: string; seed: number; lang: Lang; label: string; color?: string; onFinish: (score: number) => void }) {
  const info = duelInfo(raw)!;
  const questions = useMemo(() => (info.mode === "sentence" ? [] : duelQuestions(raw, lang, seed)), [raw, lang, seed, info.mode]);
  const sentences = useMemo(() => (info.mode === "sentence" ? duelSentences(raw, seed) : []), [raw, seed, info.mode]);
  const points = useRef(0);
  const [k, setK] = useState(0);

  if (info.mode === "sentence") {
    const s = sentences[k];
    if (!s) return null;
    return (
      <div>
        <p className="mb-2 text-center text-sm font-semibold">
          {label} · {k + 1} / {sentences.length}
        </p>
        <SentenceBuilder
          key={k}
          sentence={s}
          lang={lang}
          rng={seededRng(seed + k)}
          onDone={(ok, ms) => {
            // Right answers score; quick ones (under 20 s) score double.
            points.current += ok ? (ms < 20000 ? 2 : 1) : 0;
            if (k + 1 >= sentences.length) onFinish(points.current);
            else setK(k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <Quiz
      questions={questions}
      label={label}
      color={color}
      lives={info.mode === "streak" ? STREAK_LIVES : undefined}
      onAnswer={(_, ok, ms) => {
        points.current += answerPoints(info.mode, ok, ms);
      }}
      onFinish={() => onFinish(Math.min(50, points.current))}
    />
  );
}
