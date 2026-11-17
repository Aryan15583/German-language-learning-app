import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { Missing } from "../components/NotFound";
import { Button, Card, Meaning, PageHeader, ProgressBar, Speak } from "../components/ui";
import { findTopic, levelOfTopic, meaning, subLevelOfTopic } from "../core/content/levels";
import { useId } from "../web/nav";
import { nextReviewLabel, stage } from "../core/lib/srs";
import { today } from "../web/progress";
import { knownInUnit, unitPassed, useProgress } from "../web/progress";

/** One unit: learn the words, then the quiz. Tips and the word list fold away. */
export default function Unit() {
  const id = useId();
  const { state } = useProgress();
  const p = state.partners[state.learner];
  const unit = id ? findTopic(id) : undefined;
  const level = id ? levelOfTopic(id) : undefined;
  const sub = id ? subLevelOfTopic(id) : undefined;
  if (id === null) return <Missing loading />;
  if (!unit || !level || !sub) return <Missing />;

  const known = knownInUnit(p, unit.id);
  const allKnown = known >= unit.words.length;
  const passed = unitPassed(p, unit.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={`${level.id} · ${sub.title}`} back="/learn" />
        <div className="text-center">
          <p className="text-7xl">{unit.emoji}</p>
          <h1 className="mt-1 font-script text-4xl font-bold text-plum">{unit.title}</h1>
          {passed ? <p className="mt-1 font-bold text-good">⭐ Done! Great job</p> : null}
        </div>

        <Card className="mt-5">
          <p className="font-semibold text-ink">
            You know {known} of {unit.words.length} words
          </p>
          <ProgressBar value={known / unit.words.length} className="mt-2" color={allKnown ? "bg-good" : "bg-plum"} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button href={`/lesson?id=${unit.id}`} size="lg" variant={allKnown ? "soft" : "good"}>
              📚 Learn the words
            </Button>
            <Button href={`/practice?id=${unit.id}`} size="lg" variant={allKnown && !p.practised.includes(unit.id) ? "good" : "soft"}>
              🗣️ Practise
            </Button>
            <Button href={`/quiz?id=${unit.id}`} size="lg" variant={allKnown && !passed ? "good" : "soft"}>
              ✏️ {passed ? "Do the quiz again" : "Quiz"}
            </Button>
          </div>
          <p className="mt-3 text-center text-sm text-muted">{allKnown ? (p.practised.includes(unit.id) ? "You know all the words — try the quiz!" : "Now practise: hear, say, type and use them.") : "Learn → practise → quiz."}</p>
        </Card>

        <Card className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-rose">Key phrases</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {unit.words.slice(0, 4).map((w) => (
              <li key={w.de} className="flex items-center gap-3 rounded-2xl bg-blush/60 px-3 py-2">
                <Speak text={w.de} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{w.de}</p>
                  <p className="truncate text-sm text-muted">{meaning(w, p.lang)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Fold title={`💡 Little grammar tip: ${unit.tip.title}`}>
          <p className="whitespace-pre-line text-ink">{unit.tip.body}</p>
        </Fold>
        <Card className="mt-4 p-0">
          <Link href="/grammar" className="flex items-center gap-2 px-5 py-4 font-bold text-ink hover:text-plum">
            <span className="flex-1">🤔 Why is German like this? (grammar bites)</span>→
          </Link>
        </Card>
        <Fold title="🇮🇳 Marathi ↔ German">
          <p className="text-ink">{meaning(unit.compare, p.lang)}</p>
        </Fold>
        <Fold title={`📖 All ${unit.words.length} words`}>
          <ul className="divide-y divide-line/60">
            {unit.words.map((w) => (
              <li key={w.de} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <p className="font-bold text-ink">{w.de}</p>
                  <Meaning w={w} lang={p.lang} className="text-sm" />
                  <p className="mt-0.5 text-xs text-muted">
                    {stage(p.memory[w.de]).emoji} {stage(p.memory[w.de]).label} · next review: {nextReviewLabel(p.memory[w.de], today())}
                  </p>
                </div>
                <Speak text={w.de} />
              </li>
            ))}
          </ul>
        </Fold>
      </div>
    </AppShell>
  );
}

function Fold({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="mt-4 p-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-5 py-4 text-left font-bold text-ink">
        <span className="flex-1">{title}</span>
        <ChevronDown className={open ? "rotate-180 transition" : "transition"} size={20} />
      </button>
      {open ? <div className="px-5 pb-5 anim-fade-up">{children}</div> : null}
    </Card>
  );
}
