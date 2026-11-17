import { GraduationCap, Lock, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { LevelPicker } from "../components/pickers";
import { Button, Card, cx, ProgressBar, Script } from "../components/ui";
import { LEVELS, levelIndex, type LevelId, type Topic } from "../core/content/levels";
import { unitState, type UnitState } from "../core/lib/path";
import { examReady, isLocked, levelProgress, useProgress } from "../web/progress";

// Bubbles zig-zag gently down the page, like a game map.
const OFFSETS = [0, 64, 0, -64];

/** The learning path: big bubbles to tap, one after another. */
export default function Learn() {
  const { state } = useProgress();
  const p = state.partners[state.learner];
  const [picked, setPicked] = useState<LevelId | null>(null);
  const level = LEVELS[levelIndex(picked ?? LEVELS[p.unlocked].id)];
  const locked = isLocked(p, level);
  const prog = levelProgress(p, level);
  const passed = p.examsPassed.includes(level.id);
  const ready = examReady(p, level);
  const testHref = `/exam?id=${level.id}`;
  let n = 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Script className="text-4xl">Learn Together 🗺️</Script>
        <p className="mb-3 text-muted">Tap the glowing bubble. Each one is a few words and a quiz.</p>
        <Button href="/vocab" variant="soft" size="sm" className="mb-4">
          📖 My words — and how they change
        </Button>
        <LevelPicker value={level.id} unlocked={p.unlocked} onChange={setPicked} />

        <Card className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">
                {level.id} · {level.name} {passed ? "🎓" : ""}
              </p>
              <p className="text-sm text-muted">{level.blurb}</p>
            </div>
            <span className="text-sm font-semibold text-plum">
              {prog.passed} / {prog.total}
            </span>
          </div>
          <ProgressBar value={prog.share} className="mt-3" />
        </Card>

        {locked ? (
          <Card className="mt-4 text-center">
            <Lock className="mx-auto text-muted" size={40} />
            <p className="mt-2 text-lg font-bold">Not open yet</p>
            <p className="mx-auto mt-1 max-w-sm text-muted">
              Finish {LEVELS[levelIndex(level.id) - 1].id} first. Already know {level.id}? You can skip ahead by passing its big test.
            </p>
            <Button variant="soft" href={testHref} className="mt-4">
              Try the {level.id} big test
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col items-center py-4">
            {level.subLevels.map((sub, k) => (
              <div key={sub.id} className="flex w-full flex-col items-center">
                <p className={cx("mb-2 rounded-full bg-blush px-4 py-1 text-sm font-bold text-plum", k ? "mt-6" : "mt-1")}>
                  Part {k + 1} · {sub.title}
                </p>
                {sub.units.map((u) => (
                  <Bubble key={u.id} unit={u} state={unitState(p, u)} offset={OFFSETS[n++ % OFFSETS.length]} />
                ))}
              </div>
            ))}
            <Link
              href={ready || passed ? testHref : "#"}
              aria-disabled={!(ready || passed)}
              aria-label={`${level.id} big test`}
              onClick={(e) => !(ready || passed) && e.preventDefault()}
              className={cx("mt-6 flex flex-col items-center", !(ready || passed) && "cursor-not-allowed opacity-50")}
            >
              <span className={cx("grid h-28 w-28 place-items-center rounded-full text-white shadow-soft", passed ? "bg-gold" : ready ? "bg-plum anim-pulse-ring" : "bg-line text-muted")}>
                {ready || passed ? <GraduationCap size={48} /> : <Lock size={40} />}
              </span>
              <span className="mt-2 text-lg font-extrabold text-ink">Big test</span>
              <span className="text-sm text-muted">{passed ? "Passed! 🎉" : ready ? "You’re ready — tap to start" : "Finish all bubbles first"}</span>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Bubble({ unit, state, offset }: { unit: Topic; state: UnitState; offset: number }) {
  return (
    <Link
      href={`/unit?id=${unit.id}`}
      aria-label={`${unit.title}${state === "done" ? ", done" : state === "next" ? ", start here" : ""}`}
      className="my-2 flex flex-col items-center"
      style={{ transform: `translateX(${offset}px)` }}
    >
      <span
        className={cx(
          "relative grid h-[88px] w-[88px] place-items-center rounded-full text-4xl transition hover:scale-105",
          state === "done" && "bg-gold shadow-soft",
          state === "next" && "bg-plum shadow-soft anim-pulse-ring",
          state === "open" && "border-[3px] border-line bg-surface",
        )}
      >
        <span aria-hidden>{unit.emoji}</span>
        {state === "done" ? <Star className="absolute -right-1 -top-1 text-gold" fill="#fff6d8" size={26} /> : null}
      </span>
      {state === "next" ? <span className="-mt-3 rounded-full bg-rose px-3 py-0.5 text-xs font-extrabold text-white">START</span> : null}
      <span className="mt-1 max-w-40 text-center font-bold text-ink">{unit.title}</span>
    </Link>
  );
}
