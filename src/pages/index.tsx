import { BookOpen, ChevronRight, Flame, Gamepad2, Heart, Mail, MessageCircle, Play, Swords, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, cx, HeartPlane, Mascot, ProgressBar, Ring, Script, Speak } from "../components/ui";
import { LEVELS, levelWords, meaning } from "../core/content/levels";
import { DAILY_GOAL } from "../core/lib/game";
import { nextStep, stepLabel } from "../core/lib/path";
import { dailyIndex } from "../core/lib/util";
import { hrefOf } from "../web/nav";
import { couple, currentStreak, daysLearned, lastDays, partnerName, today, useProgress } from "../web/progress";
import { ago, goalShare, hasPartner, personStats, weekdayOf } from "../web/stats";

const QUOTES = [
  { de: "Die Liebe überwindet alle Grenzen.", en: "Love overcomes all borders." },
  { de: "Zusammen ist man weniger allein.", en: "Together, you're less alone." },
  { de: "Ich liebe dich mehr als gestern.", en: "I love you more than yesterday." },
  { de: "Du bist mein Zuhause.", en: "You are my home." },
  { de: "Schritt für Schritt, Hand in Hand.", en: "Step by step, hand in hand." },
];

/** The home dashboard: one clear next step, then everything else at a glance. */
export default function Home() {
  const { state, accountMode, dismissWelcome } = useProgress();
  // Pages only render in the browser (the app gate shows a spinner while exporting), so dates are safe here.
  const [day] = useState(() => dailyIndex(1000));
  const who = state.learner;
  const me = state.partners[who];
  const streak = currentStreak(state);
  const mine = personStats(state, who, today(), streak);
  const both = hasPartner(state, accountMode);
  const other = who === 0 ? 1 : 0;
  const theirs = both ? personStats(state, accountMode ? 1 : other, today(), streak) : null;
  const step = nextStep(me, day);
  const label = stepLabel(step);
  const words = levelWords(LEVELS[me.unlocked]);
  const word = words[day % words.length];
  const quote = QUOTES[day % QUOTES.length];
  const journeyDay = Math.max(1, daysLearned(me));
  const linked = couple.isLinked(state);
  const name = partnerName(state, who);
  const greet = both && theirs ? `Hallo, ${name} & ${theirs.name}!` : `Hallo, ${name}!`;

  return (
    <AppShell>
      {/* Phone greeting */}
      <div className="mb-4 lg:hidden">
        <Script className="text-[34px] leading-tight">{greet} ♡</Script>
        <p className="text-muted">Let’s continue your journey.</p>
      </div>

      {!state.welcomeDone ? <HowItWorks linked={linked || !accountMode} onDone={dismissWelcome} /> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Hero (computers) */}
        <section className="relative hidden overflow-hidden rounded-[28px] bg-gradient-to-r from-blush via-[#fbdde6] to-[#f6cbd8] shadow-card lg:col-span-2 lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img src="/art/hero.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[58%] object-cover [mask-image:linear-gradient(to_right,transparent,black_30%)]" />
          <div className="relative max-w-[52%] p-8">
            <p className="text-sm font-semibold text-plum/80">{greet} 💞</p>
            <Script as="h1" className="mt-1 text-5xl leading-[1.05]">
              Learn German
              <br />
              Together
            </Script>
            <p className="mt-3 text-ink/80">Grow closer, one word at a time.</p>
            <HeartPlane className="mt-2 h-8 w-24 text-plum" />
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-plum shadow-card">
              <Heart size={16} fill="currentColor" /> Day {journeyDay} of your journey
            </span>
          </div>
        </section>

        {/* Continue learning — the one big button */}
        <Card className="flex flex-col p-0 lg:row-span-1">
          <div className="relative h-32 overflow-hidden rounded-t-3xl bg-blush">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
            <img src="/art/gate.jpg" alt="" className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-plum">{step.level.id}</span>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-sm font-semibold text-muted">{mine.todayXp >= DAILY_GOAL ? "Goal done! Want more? Next up" : "Continue learning"}</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-ink">
              <span aria-hidden>{label.emoji}</span> {label.title}
            </h2>
            <p className="text-sm text-muted">{label.detail}</p>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={mine.levelShare} />
              <span className="text-sm font-semibold text-plum">{Math.round(mine.levelShare * 100)}%</span>
            </div>
            <Button href={hrefOf(step)} size="lg" full className="mt-4">
              <Play size={20} fill="currentColor" /> Start
            </Button>
          </div>
        </Card>

        {/* Phone tiles */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          <Tile href="/learn" icon={<BookOpen />} title="Lessons" sub="Your path" />
          <Tile href="/quizzes" icon={<Gamepad2 />} title="Couple Quizzes" sub="Play together" />
          <Tile href="/progress" icon={<Target />} title="Progress" sub="Your stats" />
          <Tile href="/talk" icon={<MessageCircle />} title="Challenges" sub="Chat & role-play" />
        </div>

        {/* Our progress */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">{theirs ? "Our progress" : "Your progress"}</h2>
            <Link href="/progress" className="text-sm font-semibold text-plum hover:underline">
              Details
            </Link>
          </div>
          <div className="mt-4 flex items-center justify-around gap-2">
            <Person stats={mine} color="#8b2f55" />
            {theirs ? (
              <>
                <Heart className="text-rose" fill="currentColor" size={22} />
                <Person stats={theirs} color="#5a7fc4" />
              </>
            ) : (
              <Link href="/us" className="flex flex-col items-center gap-2 text-center text-sm text-muted hover:text-plum">
                <span className="grid h-[92px] w-[92px] place-items-center rounded-full border-2 border-dashed border-rose-soft text-3xl">💞</span>
                Link your partner
              </Link>
            )}
          </div>
        </Card>

        {/* Quote */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-card to-blush">
          <p className="text-xs font-bold uppercase tracking-wider text-rose">Spruch des Tages</p>
          <p className="mt-2 font-script text-3xl font-bold leading-snug text-plum">“{quote.de}”</p>
          <p className="mt-1 text-muted">{quote.en}</p>
          <div className="mt-3 flex items-center gap-2">
            <Speak text={quote.de} />
            <span className="text-sm text-muted">Listen</span>
          </div>
        </Card>

        {/* Streak */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink">Streak</h2>
              <p className="mt-1 flex items-baseline gap-1">
                <Flame className="self-center text-rose" fill="currentColor" size={26} />
                <span className="text-4xl font-extrabold text-plum">{streak}</span>
                <span className="text-muted">{streak === 1 ? "day" : "days"}</span>
              </p>
              <p className="text-sm text-muted">{streak ? "Keep it going! ✨" : "Learn today to start one!"}</p>
            </div>
            <Mascot size={78} className={cx(streak ? "anim-beat" : "")} />
          </div>
          <WeekBars days={lastDays(me, today())} />
        </Card>

        {/* Daily goal */}
        <Card>
          <h2 className="text-lg font-bold text-ink">Today’s goal</h2>
          <div className="mt-3 flex items-center gap-4">
            <Ring value={goalShare(mine.todayXp)} size={86} stroke={9} color={mine.todayXp >= DAILY_GOAL ? "#3f9b6e" : "#e0718f"}>
              <Target size={26} className="text-plum" />
            </Ring>
            <div>
              <p className="text-2xl font-extrabold text-ink">
                {mine.todayXp} <span className="text-base font-semibold text-muted">/ {DAILY_GOAL} XP</span>
              </p>
              <p className="text-sm text-muted">{mine.todayXp >= DAILY_GOAL ? "Done for today 🎉" : "A lesson and a quiz will do it."}</p>
              <Link href="/goals" className="mt-1 inline-flex items-center text-sm font-semibold text-plum hover:underline">
                Couple goals <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </Card>

        {/* Word of the day */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-rose">⭐ Word of the day</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="flex-1 text-2xl font-extrabold text-ink">{word.de}</p>
            <Speak text={word.de} />
          </div>
          <p className="text-muted">{meaning(word, me.lang)}</p>
        </Card>

        {/* This week's battle */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Swords size={18} className="text-plum" /> This week
            </h2>
            <Link href={linked ? "/us" : "/progress"} className="text-sm font-semibold text-plum hover:underline">
              {linked ? "Chat" : "Details"}
            </Link>
          </div>
          {theirs ? (
            <>
              <div className="mt-3 flex items-end justify-around text-center">
                <div>
                  <p className="text-3xl font-extrabold text-plum">{mine.weekXp}</p>
                  <p className="text-xs text-muted">{mine.name}</p>
                </div>
                <p className="pb-4 text-sm text-muted">vs</p>
                <div>
                  <p className="text-3xl font-extrabold text-partner">{theirs.weekXp}</p>
                  <p className="text-xs text-muted">{theirs.name}</p>
                </div>
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-ink">
                {mine.weekXp === theirs.weekXp ? "Gleichstand 🤝" : mine.weekXp > theirs.weekXp ? `${mine.name} leads 👑` : `${theirs.name} leads 🔥`}
              </p>
            </>
          ) : (
            <p className="mt-3 text-3xl font-extrabold text-plum">
              {mine.weekXp} <span className="text-base font-semibold text-muted">XP so far</span>
            </p>
          )}
        </Card>

        {/* Couple activities (computers show three cards; phones have the tiles) */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Couple activities</h2>
            <Link href="/quizzes" className="text-sm font-semibold text-plum hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Activity href="/quizzes" icon={<Swords />} title="Couple Quizzes" sub="Duel each other — who knows more?" art="/art/couple.jpg" />
            <Activity href="/talk" icon={<MessageCircle />} title="Interactive Lessons" sub="Chat in German and act out scenes." art="/art/tower.jpg" />
            <Activity href="/note" icon={<Mail />} title="Love notes" sub="Write a little German note for your partner." art="/art/skyline.jpg" />
          </div>
        </section>

        <RecentActivity />
      </div>
    </AppShell>
  );
}

function Person({ stats, color }: { stats: ReturnType<typeof personStats>; color: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Ring value={stats.levelShare} size={92} stroke={9} color={color}>
        <span className="text-xl font-extrabold text-ink">{Math.round(stats.levelShare * 100)}%</span>
      </Ring>
      <p className="mt-2 max-w-[7rem] truncate font-semibold text-ink">{stats.name}</p>
      <p className="text-xs text-muted">
        {stats.levelId} · {stats.wordsKnown} words
      </p>
    </div>
  );
}

function WeekBars({ days }: { days: { date: string; xp: number }[] }) {
  const max = Math.max(DAILY_GOAL, ...days.map((d) => d.xp));
  return (
    <div className="mt-4 flex items-end justify-between gap-1.5" role="img" aria-label={`XP in the last 7 days: ${days.map((d) => d.xp).join(", ")}`}>
      {days.map((d, k) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-16 w-full items-end overflow-hidden rounded-lg bg-blush">
            <div className={cx("w-full rounded-lg", d.xp ? (k === days.length - 1 ? "bg-plum" : "bg-rose") : "")} style={{ height: `${(d.xp / max) * 100}%` }} />
          </div>
          <span className={cx("text-[11px]", k === days.length - 1 ? "font-bold text-plum" : "text-muted")}>{weekdayOf(d.date).slice(0, 2)}</span>
        </div>
      ))}
    </div>
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="flex flex-col gap-2 rounded-3xl border border-line/70 bg-card/90 p-4 shadow-card transition hover:border-rose active:scale-[0.98]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blush text-plum">{icon}</span>
      <span className="font-bold text-ink">{title}</span>
      <span className="-mt-1.5 text-xs text-muted">{sub}</span>
    </Link>
  );
}

function Activity({ href, icon, title, sub, art }: { href: string; icon: ReactNode; title: string; sub: string; art: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 overflow-hidden rounded-3xl border border-line/70 bg-card/90 p-4 shadow-card transition hover:border-rose">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush text-plum">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">{title}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img src={art} alt="" className="hidden h-14 w-16 rounded-xl object-cover opacity-90 xl:block" />
      <ChevronRight className="text-muted transition group-hover:translate-x-0.5" size={20} />
    </Link>
  );
}

function RecentActivity() {
  const { state } = useProgress();
  const [now] = useState(() => Date.now());
  const fromPartner = state.chat
    .filter((m) => m.from === 1 && m.kind !== "system")
    .map((m) => ({ at: m.at, icon: m.kind === "duel" ? "⚔️" : m.kind === "word" ? "💞" : m.kind === "secret" ? "🤫" : "💌", text: `${partnerName(state, 1)} sent ${m.kind === "duel" ? "a duel" : m.kind === "word" ? "a new word" : m.kind === "secret" ? "a secret" : "a message"}` }));
  const items = [...state.log, ...fromPartner].sort((a, b) => b.at - a.at).slice(0, 5);
  return (
    <Card className="lg:col-span-3">
      <div className="flex items-center gap-2">
        <Trophy size={20} className="text-gold" />
        <h2 className="text-lg font-bold text-ink">Recent activity</h2>
      </div>
      {items.length ? (
        <ul className="mt-3 divide-y divide-line/60">
          {items.map((a, k) => (
            <li key={a.at + a.text + k} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blush text-lg" aria-hidden>
                {a.icon}
              </span>
              <span className="flex-1 text-ink">{a.text}</span>
              <span className="text-xs text-muted">{now ? ago(a.at, now) : ""}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted">Nothing yet — tap Start and your wins will show up here. 🌱</p>
      )}
    </Card>
  );
}

function HowItWorks({ linked, onDone }: { linked: boolean; onDone: () => void }) {
  const steps = [
    "Tap the big ▶ Start button. That’s it — the app picks what’s next.",
    "Learn a few words 📚, then a short quiz ✏️. Every level ends with a big test 🎓.",
    linked ? "Chat and play with your partner in 💞 Couple." : "Link with your partner in 💞 Couple to chat and play together.",
  ];
  return (
    <Card className="mb-5 border-rose-soft bg-blush/70">
      <h2 className="text-xl font-extrabold text-ink">How it works 👋</h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {steps.map((t, k) => (
          <li key={k} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum text-sm font-bold text-white">{k + 1}</span>
            <span className="text-ink">{t}</span>
          </li>
        ))}
      </ol>
      <Button className="mt-4" onClick={onDone}>
        Got it! 👍
      </Button>
    </Card>
  );
}
