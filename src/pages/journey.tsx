import { Lock, Plane } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Button, Card, cx, ProgressBar, Script } from "../components/ui";
import { JOURNEY, type JourneyStop } from "../core/content/berlin";
import { meaning } from "../core/content/levels";
import { nextStop, postcards, reachedIndex, routeShare, stopState } from "../core/lib/journey";
import { useProgress } from "../web/progress";
import { couplePoints } from "../web/journey";

/** Mumbai → Berlin: every stop teaches the German you'd need there, and gives you a postcard. */
export default function Journey() {
  const { state, accountMode } = useProgress();
  const p = state.partners[state.learner];
  const { points, together } = couplePoints(state, accountMode);
  const at = reachedIndex(points);
  const next = nextStop(points);
  const cards = postcards(p);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Script className="text-4xl">Mumbai → Berlin ✈️</Script>
          <p className="text-muted">
            Every lesson you pass moves you {together ? "both " : ""}closer. {together ? "Your journey uses the average of you two — learn together to travel faster!" : ""}
          </p>
          <Card className="mt-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>🇮🇳 Mumbai</span>
              <span className="text-plum">{Math.round(routeShare(points) * 100)}%</span>
              <span>Berlin 🇩🇪</span>
            </div>
            <div className="relative mt-2">
              <ProgressBar value={routeShare(points)} />
              <Plane className="absolute -top-2 text-plum transition-all" size={22} style={{ left: `calc(${routeShare(points) * 100}% - 11px)` }} />
            </div>
            <p className="mt-3 text-sm text-muted">{next ? `${next.toGo} more ${next.toGo === 1 ? "lesson" : "lessons"} to reach ${next.stop.emoji} ${next.stop.title}.` : "You made it to Berlin! 🎉"}</p>
          </Card>

          <ol className="relative mt-6 border-l-4 border-dashed border-rose-soft pl-6">
            <li className="mb-6">
              <span className="absolute -left-[18px] grid h-8 w-8 place-items-center rounded-full bg-plum text-white">🇮🇳</span>
              <p className="font-bold">Mumbai — the starting point</p>
              <p className="text-sm text-muted">Where it all began. 💞</p>
            </li>
            {JOURNEY.map((s, k) => (
              <Stop key={s.id} stop={s} state={stopState(p, s, points)} here={k === at} lang={p.lang} />
            ))}
          </ol>
        </div>

        <aside>
          <h2 className="mb-1 text-lg font-bold">Berlin postcards 💌</h2>
          <p className="mb-3 text-sm text-muted">
            Explore Berlin: {cards.length} of {JOURNEY.length} collected ({Math.round((cards.length / JOURNEY.length) * 100)}%). Pass a stop’s quiz to get its card.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {JOURNEY.map((s) => {
              const got = cards.includes(s);
              return (
                <div key={s.id} className={cx("overflow-hidden rounded-2xl border border-line/70 bg-white shadow-card", !got && "opacity-55")}>
                  <div className="relative h-20 bg-blush">
                    {got ? (
                      // eslint-disable-next-line @next/next/no-img-element -- static export
                      <img src={s.postcard.art} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-muted">
                        <Lock size={22} />
                      </span>
                    )}
                    <span className="absolute bottom-1 right-1 rounded-full bg-white/90 px-1.5 text-sm">{s.postcard.emoji}</span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose">🇩🇪 Berlin</p>
                    <p className="text-sm font-bold leading-tight">{s.postcard.place}</p>
                    {got ? <p className="mt-0.5 font-script text-lg leading-tight text-plum">“{s.postcard.line}” ❤️</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <Card className="mt-4 bg-gradient-to-br from-card to-blush">
            <p className="font-bold">✈️ Berlin Ready</p>
            <p className="mt-1 text-sm text-muted">The final challenge: a 7-day trip in German only. Opens after the B1 big test.</p>
            <Button href="/ready" variant="soft" size="sm" className="mt-3">
              Take a look
            </Button>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Stop({ stop, state, here, lang }: { stop: JourneyStop; state: ReturnType<typeof stopState>; here: boolean; lang: "en" | "mr" | "mr-Latn" }) {
  const id = `berlin-${stop.id}`;
  return (
    <li className="relative mb-6">
      <span
        className={cx(
          "absolute -left-[42px] grid h-9 w-9 place-items-center rounded-full text-lg",
          state === "explored" ? "bg-gold" : state === "open" ? "bg-plum text-white" : "bg-line",
          here && "anim-pulse-ring",
        )}
      >
        {state === "locked" ? <Lock size={16} className="text-muted" /> : stop.emoji}
      </span>
      <Card className={cx("p-4", state === "locked" && "opacity-60")}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-bold">
            {stop.emoji} {stop.title}
          </p>
          {here ? <span className="rounded-full bg-rose px-2.5 py-0.5 text-xs font-bold text-white">You are here</span> : null}
          {state === "explored" ? <span className="rounded-full bg-gold/30 px-2.5 py-0.5 text-xs font-bold text-ink">Postcard ✓</span> : null}
        </div>
        <p className="text-sm text-muted">{meaning(stop.about, lang)}</p>
        {state === "locked" ? (
          <p className="mt-2 text-sm text-muted">🔒 Opens after {stop.need} lessons.</p>
        ) : (
          <>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Learn:</span> {stop.words.slice(0, 4).map((w) => w.de).join(" · ")} …
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" href={`/lesson?id=${id}`}>
                📚 Learn the words
              </Button>
              <Button size="sm" variant="soft" href={`/practice?id=${id}`}>
                🗣️ Practise
              </Button>
              <Button size="sm" variant={state === "explored" ? "soft" : "good"} href={`/quiz?id=${id}`}>
                ✏️ Quiz {state === "explored" ? "again" : "→ postcard"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </li>
  );
}
