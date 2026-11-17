import { AppShell } from "../components/AppShell";
import { Card, Chip, Script, Speak } from "../components/ui";
import { GRAMMAR_BITES } from "../core/content/extras";
import { LEVEL_IDS, meaning } from "../core/content/levels";
import { useProgress } from "../web/progress";
import { useState } from "react";

/** Why is German like this? Tiny explanations, word by word. */
export default function Grammar() {
  const { state } = useProgress();
  const lang = state.partners[state.learner].lang;
  const [level, setLevel] = useState<string>("all");
  const list = GRAMMAR_BITES.filter((b) => level === "all" || b.level === level);
  return (
    <AppShell>
      <Script className="text-4xl">Why is German like this? 🤔</Script>
      <p className="text-muted">Tiny explanations, word by word. No textbook pages.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["all", ...LEVEL_IDS.filter((l) => GRAMMAR_BITES.some((b) => b.level === l))].map((l) => (
          <Chip key={l} selected={level === l} onClick={() => setLevel(l)}>
            {l === "all" ? "All" : l}
          </Chip>
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {list.map((b) => (
          <Card key={b.id}>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-bold text-plum">{b.level}</span>
              <h2 className="font-bold">{b.title}</h2>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <p className="flex-1 text-2xl font-bold">{b.example.de}</p>
              <Speak text={b.example.de} />
            </div>
            <p className="text-muted">{meaning(b.example, lang)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {b.gloss.map(([de, en], k) => (
                <span key={k} className="rounded-xl bg-surface px-3 py-1.5 text-center shadow-card">
                  <span className="block font-bold text-plum">{de}</span>
                  <span className="block text-xs text-muted">{en}</span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm">💡 {meaning(b.tip, lang)}</p>
            {b.table ? (
              <table className="mt-3 text-sm">
                <tbody>
                  {b.table.map(([a, c]) => (
                    <tr key={a}>
                      <td className="pr-4 text-muted">{a}</td>
                      <td className="font-semibold">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
