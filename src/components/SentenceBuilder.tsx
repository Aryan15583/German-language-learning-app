import { Check, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { meaning, type Lang } from "../core/content/levels";
import { endMark, orderCorrect, shuffledTiles, tokens, type Sentence } from "../core/lib/sentences";
import type { Rng } from "../core/lib/util";
import { speakGerman } from "../web/speech";
import { since } from "./Quiz";
import { Button, Card, cx, Speak } from "./ui";

/** Tap the word tiles into the right order. German word order, learned by doing. */
export function SentenceBuilder({ sentence, lang, rng, onDone, showMeaning = true }: { sentence: Sentence; lang: Lang; rng?: Rng; onDone: (correct: boolean, ms: number) => void; showMeaning?: boolean }) {
  const tiles = useMemo(() => shuffledTiles(sentence.de, rng).map((w, k) => ({ w, k })), [sentence.de]); // eslint-disable-line react-hooks/exhaustive-deps -- shuffle once per sentence
  const [built, setBuilt] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, [sentence.de]);
  const words = built.map((k) => tiles[k].w);
  const full = built.length === tiles.length;

  const check = () => {
    const ok = orderCorrect(words, sentence.de);
    setResult(ok);
    speakGerman(sentence.de);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="text-center">
        <p className="text-sm font-semibold text-muted">Put the words in order</p>
        {showMeaning ? <p className="mt-1 text-xl font-bold text-ink">{meaning(sentence, lang)}</p> : null}
      </Card>
      <div className={cx("mt-4 flex min-h-16 flex-wrap items-center gap-2 rounded-3xl border-2 border-dashed p-3", result === null ? "border-rose-soft" : result ? "border-good bg-good/10" : "border-bad bg-bad/10")} aria-label="Your sentence">
        {built.map((k, pos) => (
          <button key={k} type="button" disabled={result !== null} onClick={() => setBuilt(built.filter((_, i) => i !== pos))} className="rounded-xl bg-plum px-3 py-2 font-semibold text-white shadow-soft">
            {tiles[k].w}
          </button>
        ))}
        {full ? <span className="text-lg font-bold">{endMark(sentence.de)}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {tiles.map((t) => (
          <button
            key={t.k}
            type="button"
            aria-label={`Word: ${t.w}`}
            disabled={built.includes(t.k) || result !== null}
            onClick={() => setBuilt([...built, t.k])}
            className={cx("rounded-xl border-2 px-3 py-2 font-semibold transition", built.includes(t.k) ? "border-transparent bg-line/40 text-transparent" : "border-line bg-surface text-ink hover:border-rose")}
          >
            {t.w}
          </button>
        ))}
      </div>
      {result === null ? (
        <div className="mt-5 flex gap-3">
          <Button variant="soft" onClick={() => setBuilt([])} disabled={!built.length}>
            <RotateCcw size={18} />
          </Button>
          <Button full size="lg" disabled={!full} onClick={check}>
            Check
          </Button>
        </div>
      ) : (
        <div aria-live="polite" className={cx("mt-5 rounded-3xl p-5 anim-pop-in", result ? "bg-good/12" : "bg-bad/10")}>
          <p className={cx("flex items-center gap-2 text-lg font-extrabold", result ? "text-good" : "text-bad")}>
            {result ? <Check /> : <X />} {result ? "Perfekt!" : "Nicht ganz — not quite"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="flex-1 text-ink">{sentence.de}</p>
            <Speak text={sentence.de} />
          </div>
          <Button full size="lg" className="mt-3" onClick={() => onDone(result, since(started.current))}>
            Continue
          </Button>
        </div>
      )}
      <p className="sr-only">{tokens(sentence.de).length} words</p>
    </div>
  );
}
