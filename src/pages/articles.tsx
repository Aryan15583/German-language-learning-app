import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Button, Card, PageHeader, ProgressBar, Script, Speak, cx } from "../components/ui";
import { ARTICLE_TIPS, articleRound, type ArticleQuestion } from "../core/lib/couplelife";
import { today, useProgress, XP } from "../web/progress";
import { playDone, playRight, playWrong } from "../web/sound";

const ROUND = 10;
const STYLE: Record<"der" | "die" | "das", string> = {
  der: "bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-900/40 dark:text-sky-200",
  die: "bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-200",
  das: "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200",
};

/** der, die or das? A quick game: tap the right article. */
export default function Articles() {
  const { state, practiced, log, did } = useProgress();
  const learner = state.learner;
  const [round, setRound] = useState(0);
  const [qs, setQs] = useState<ArticleQuestion[]>(() => articleRound(`${today()}|${learner}|0`, ROUND));
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<"der" | "die" | "das" | null>(null);
  const [right, setRight] = useState(0);
  const done = at >= qs.length;

  const again = () => {
    const r = round + 1;
    setRound(r);
    setQs(articleRound(`${today()}|${learner}|${r}`, ROUND));
    setAt(0);
    setRight(0);
    setPicked(null);
  };

  if (done) {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-7xl anim-beat">{right >= 8 ? "🏆" : right >= 5 ? "🎉" : "💪"}</p>
          <Script className="mt-2 text-4xl">{right >= 8 ? "Super gemacht!" : right >= 5 ? "Gut gemacht!" : "Weiter so!"}</Script>
          <p className="text-muted">
            {right} of {qs.length} articles right.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" full variant="good" onClick={again}>
              ▶ Play again
            </Button>
            <KeepGoing />
          </div>
        </div>
      </AppShell>
    );
  }

  const q = qs[at];
  const ok = picked === q.noun.article;
  const choose = (a: "der" | "die" | "das") => {
    if (picked) return;
    setPicked(a);
    if (a === q.noun.article) {
      setRight((n) => n + 1);
      playRight();
    } else playWrong();
  };
  const next = () => {
    const last = at + 1 >= qs.length;
    if (last) {
      const total = right;
      practiced(learner, 5 + total * XP.correctAnswer);
      if (total === qs.length) did(learner, "perfect");
      log("🎯", `der/die/das: ${total} of ${qs.length} right`);
      playDone();
    }
    setPicked(null);
    setAt(at + 1);
  };

  return (
    <AppShell focus>
      <PageHeader title="der, die oder das?" back="/play" />
      <div className="mx-auto max-w-md">
        <ProgressBar value={at / qs.length} />
        <Card className="mt-6 flex flex-col items-center py-10 text-center">
          <p className="text-sm font-semibold text-muted">Which article?</p>
          <div className="mt-3 flex items-center gap-2">
            <p className="text-4xl font-extrabold text-ink">
              {picked ? <span className={cx("mr-2 rounded-xl px-2", STYLE[q.noun.article])}>{q.noun.article}</span> : <span className="mr-2 text-muted">___</span>}
              {q.noun.word}
            </p>
            {picked ? <Speak text={q.noun.lemma} /> : null}
          </div>
          <p className="mt-2 text-muted">{q.noun.en}</p>
        </Card>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {q.options.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => choose(a)}
              disabled={!!picked}
              className={cx(
                "rounded-2xl py-5 text-2xl font-extrabold ring-2 ring-inset transition active:scale-95",
                STYLE[a],
                picked && a !== q.noun.article && a !== picked && "opacity-40",
                picked === a && !ok && "ring-4 ring-bad",
              )}
            >
              {a}
            </button>
          ))}
        </div>
        {picked ? (
          <div className={cx("mt-5 rounded-3xl p-4 anim-fade-up", ok ? "bg-good/15" : "bg-blush")}>
            <p className="font-bold text-ink">{ok ? "Richtig! ✨" : `It’s „${q.noun.lemma}“`}</p>
            {!ok ? <p className="mt-1 text-sm text-muted">💡 {ARTICLE_TIPS[q.noun.article]}</p> : q.noun.plural ? <p className="mt-1 text-sm text-muted">Plural: {q.noun.plural}</p> : null}
            <Button full size="lg" variant={ok ? "good" : "primary"} className="mt-3" onClick={next}>
              {at + 1 >= qs.length ? "See my score" : "Continue"}
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-center text-xs text-muted">
            <span className="font-semibold text-sky-700 dark:text-sky-300">der</span> · <span className="font-semibold text-rose-700 dark:text-rose-300">die</span> ·{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">das</span> — colours help you remember!
          </p>
        )}
      </div>
    </AppShell>
  );
}
