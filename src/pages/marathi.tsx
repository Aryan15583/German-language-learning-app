import { AppShell } from "../components/AppShell";
import { Card, Script, Speak } from "../components/ui";
import { COMPARISONS } from "../core/content/extras";
import { allTopics, meaning } from "../core/content/levels";
import { romanizeMarathi } from "../core/lib/romanize";
import { useProgress } from "../web/progress";

/** 🇮🇳 Marathi → 🇩🇪 German: the same idea in three languages, and why they're alike (or not). */
export default function Marathi() {
  const { state } = useProgress();
  const lang = state.partners[state.learner].lang;
  return (
    <AppShell>
      <Script className="text-4xl">मराठी ↔ Deutsch 🇮🇳🇩🇪</Script>
      <p className="text-muted">German is closer to Marathi than you’d think: तू/तुम्ही = du/Sie, and after “weil” the verb goes last — just like Marathi.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {COMPARISONS.map((c) => (
          <Card key={c.de}>
            <p className="text-xs font-bold uppercase tracking-wider text-rose">🇮🇳 Marathi</p>
            <p className="text-xl font-bold">{c.mr}</p>
            <p className="text-sm italic text-muted">{romanizeMarathi(c.mr)}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-rose">🇩🇪 German</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xl font-bold text-plum">{c.de}</p>
              <Speak text={c.de} />
            </div>
            <p className="mt-2 text-sm text-muted">🇬🇧 {c.en}</p>
            {c.note ? <p className="mt-2 rounded-2xl bg-blush/70 p-3 text-sm">💡 {meaning(c.note, lang)}</p> : null}
          </Card>
        ))}
      </div>
      <h2 className="mb-2 mt-8 text-lg font-bold">From every lesson</h2>
      <Card className="divide-y divide-line/60 py-2">
        {allTopics().map((u) => (
          <div key={u.id} className="py-3">
            <p className="font-semibold">
              {u.emoji} {u.title}
            </p>
            <p className="text-sm text-muted">{meaning(u.compare, lang)}</p>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}
