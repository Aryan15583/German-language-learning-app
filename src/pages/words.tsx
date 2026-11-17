import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, fieldClass, Meaning, PageHeader, Script, Speak, Spinner } from "../components/ui";
import { LIMITS } from "../core/lib/link";
import { couple, useProgress } from "../web/progress";
import { shareText } from "../web/share";

/** The couple's own words: added by either partner, shared to both phones. */
export default function Words() {
  const { state, addOurWord, log } = useProgress();
  const [de, setDe] = useState("");
  const [en, setEn] = useState("");
  const [mr, setMr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const lang = state.partners[state.learner].lang;
  const linked = couple.isLinked(state);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!de.trim() || !en.trim() || busy) return;
    setBusy(true);
    const r = await addOurWord({ de: de.trim(), en: en.trim(), mr: mr.trim() });
    log("💞", `Added “${de.trim()}” to our words`);
    setBusy(false);
    setDe("");
    setEn("");
    setMr("");
    if (!r) setNote("Added 💞");
    else if (r.delivered) setNote("Added and shared with your partner 💞");
    else {
      const s = await shareText(`📖 Zwei Herzen ♡ — a new word for us:\n${r.link}`);
      setNote(s === "copied" ? "Added. Link copied — paste it to your partner." : "Added and shared 💞");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader title="" />
        <Script className="text-4xl">Our words 💞</Script>
        <p className="text-muted">Your own phrases — pet names, inside jokes, things you say every day. {linked ? "They appear on both phones." : ""}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Card>
            <form onSubmit={add} className="flex flex-col gap-3">
              <p className="font-bold">Add a word</p>
              <input className={fieldClass} value={de} onChange={(e) => setDe(e.target.value)} placeholder="German, e.g. Kuscheln" maxLength={LIMITS.word} aria-label="German word" />
              <input className={fieldClass} value={en} onChange={(e) => setEn(e.target.value)} placeholder="English meaning" maxLength={LIMITS.word} aria-label="English meaning" />
              <input className={fieldClass} value={mr} onChange={(e) => setMr(e.target.value)} placeholder="मराठी (optional)" maxLength={LIMITS.word} aria-label="Marathi meaning" />
              {busy ? (
                <Spinner />
              ) : (
                <Button type="submit" disabled={!de.trim() || !en.trim()}>
                  Add 💞
                </Button>
              )}
              {note ? <p className="text-sm text-muted">{note}</p> : null}
            </form>
          </Card>
          <div>
            <h2 className="mb-2 font-bold">
              {state.customWords.length} word{state.customWords.length === 1 ? "" : "s"}
            </h2>
            {state.customWords.length ? (
              <>
                <Button variant="soft" href="/lesson?id=ours" full>
                  📚 Practise with flashcards
                </Button>
                <Card className="mt-3 divide-y divide-line/60 py-2">
                  {[...state.customWords].reverse().map((w) => (
                    <div key={w.de} className="flex items-center gap-3 py-2.5">
                      <div className="flex-1">
                        <p className="font-bold">{w.de}</p>
                        <Meaning w={w} lang={lang} className="text-sm" />
                      </div>
                      <Speak text={w.de} />
                    </div>
                  ))}
                </Card>
              </>
            ) : (
              <p className="text-muted">No words yet. Add the first one!</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
