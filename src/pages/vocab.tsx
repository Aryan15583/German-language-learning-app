import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { FormsPanel } from "../components/FormsPanel";
import { Card, Chip, cx, fieldClass, Script, Speak } from "../components/ui";
import { allTopics, allWords, meaning, type Word } from "../core/content/levels";
import { formsIn } from "../core/lib/forms";
import { stage } from "../core/lib/srs";
import { JOURNEY, journeyWords, stopTopic } from "../core/content/berlin";
import { useProgress } from "../web/progress";

type Filter = "all" | "verb" | "noun" | "adj" | "phrase";

/** My words: everything you've learned — and how each word changes its form. */
export default function Vocab() {
  const { state } = useProgress();
  const p = state.partners[state.learner];
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [scope, setScope] = useState<"learned" | "all">("learned");
  const [open, setOpen] = useState<string | null>(null);

  const learned = useMemo(() => {
    const out = new Map<string, Word>();
    const units = [...allTopics(), ...JOURNEY.map(stopTopic)];
    for (const u of units) for (const i of p.known[u.id] ?? []) if (u.words[i]) out.set(u.words[i].de, u.words[i]);
    const byDe = new Map([...allWords(), ...journeyWords()].map((w) => [w.de, w]));
    for (const k of Object.keys(p.memory)) if (byDe.has(k)) out.set(k, byDe.get(k)!);
    for (const w of state.customWords) out.set(w.de, w);
    return [...out.values()];
  }, [p.known, p.memory, state.customWords]);

  const pool = scope === "learned" ? learned : [...new Map([...allWords(), ...journeyWords(), ...state.customWords].map((w) => [w.de, w])).values()];
  const t = q.trim().toLowerCase();
  const list = pool.filter((w) => {
    if (t && !`${w.de} ${w.en} ${w.mr}`.toLowerCase().includes(t)) return false;
    if (filter === "all") return true;
    const f = formsIn(w.de);
    if (filter === "phrase") return /\s/.test(w.de.replace(/^(der|die|das)\s+/i, ""));
    return f.some((e) => e.pos === filter);
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Script className="text-4xl">My words 📖</Script>
        <p className="text-muted">Every word you’ve learned. Tap one to see how it changes — like मी जातो · तू जातोस · ते जातात.</p>

        <div className="mt-4 flex gap-2">
          <Chip selected={scope === "learned"} onClick={() => setScope("learned")}>
            Learned ({learned.length})
          </Chip>
          <Chip selected={scope === "all"} onClick={() => setScope("all")}>
            All words in the course
          </Chip>
        </div>
        <input className={cx(fieldClass, "mt-3")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search German, English or मराठी…" aria-label="Search my words" />
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["verb", "Verbs · क्रियापद"],
              ["noun", "Nouns · नाम"],
              ["adj", "Adjectives · विशेषण"],
              ["phrase", "Phrases"],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>
              {label}
            </Chip>
          ))}
        </div>

        {list.length ? (
          <Card className="mt-4 divide-y divide-line/60 py-1">
            {list.map((w) => {
              const isOpen = open === w.de;
              const forms = isOpen ? formsIn(w.de) : [];
              const st = stage(p.memory[w.de]);
              return (
                <div key={w.de} className="py-2">
                  <div className="flex items-center gap-3">
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : w.de)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 text-left">
                      <span className="text-lg" title={st.label}>
                        {p.memory[w.de] ? st.emoji : "📘"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-ink">{w.de}</span>
                        <span className="block truncate text-sm text-muted">{meaning(w, p.lang)}</span>
                      </span>
                      <span className="text-xs font-semibold text-plum">Forms</span>
                      <ChevronDown size={18} className={cx("text-muted transition", isOpen && "rotate-180")} />
                    </button>
                    <Speak text={w.de} />
                  </div>
                  {isOpen ? (
                    <div className="mt-2 grid gap-2 anim-fade-up sm:grid-cols-2">
                      {forms.length ? (
                        forms.map((e) => <FormsPanel key={e.lemma} entry={e} lang={p.lang} />)
                      ) : (
                        <p className="rounded-2xl bg-good/10 p-3 text-sm text-ink">🎉 {p.lang === "en" ? "This word never changes its form — easy!" : "हा शब्द कधीच बदलत नाही — सोपं!"}</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </Card>
        ) : (
          <p className="mt-6 text-center text-muted">{scope === "learned" && !learned.length ? "No words yet — tap ▶ Start on Home to learn your first ones! 🌱" : "No words match."}</p>
        )}
      </div>
    </AppShell>
  );
}
