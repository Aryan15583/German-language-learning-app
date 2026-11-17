import { useRouter } from "next/router";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Missing } from "../components/NotFound";
import { Button, Chip, cx, PageHeader, Speak } from "../components/ui";
import { DIALOGUES, meaning, type Dialogue } from "../core/content/levels";
import { useId } from "../web/nav";
import { partnerName, useProgress, XP, type PartnerIndex } from "../web/progress";

export default function DialoguePage() {
  const id = useId();
  const d = id ? DIALOGUES.find((x) => x.id === id) : undefined;
  if (id === null) return <Missing loading />;
  if (!d) return <Missing />;
  return <Scene key={d.id} d={d} />;
}

/** A role-play scene to read aloud together: A and B, with translations and a challenge mode. */
function Scene({ d }: { d: Dialogue }) {
  const router = useRouter();
  const { state, practiced, log, accountMode } = useProgress();
  const [showEn, setShowEn] = useState(true);
  const [swapped, setSwapped] = useState(false);
  const [challenge, setChallenge] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const speaker = (who: "a" | "b"): PartnerIndex => ((who === "a") !== swapped ? 0 : 1);

  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={`${d.level} · ${d.title}`} />
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip selected={showEn} onClick={() => setShowEn(!showEn)}>
            Show translation
          </Chip>
          <Chip
            selected={challenge}
            onClick={() => {
              setChallenge(!challenge);
              setRevealed(new Set());
            }}
          >
            Challenge: hide German
          </Chip>
          <Chip onClick={() => setSwapped(!swapped)}>Swap roles ⇄</Chip>
        </div>
        <div className="space-y-2">
          {d.lines.map((l, i) => {
            const p = speaker(l.who);
            const hidden = challenge && !revealed.has(i);
            const right = p === 1;
            return (
              <div
                key={i}
                role={hidden ? "button" : undefined}
                tabIndex={hidden ? 0 : undefined}
                aria-label={hidden ? "Reveal German line" : undefined}
                onClick={() => hidden && setRevealed(new Set(revealed).add(i))}
                onKeyDown={(e) => hidden && (e.key === "Enter" || e.key === " ") && setRevealed(new Set(revealed).add(i))}
                className={cx("max-w-[86%] rounded-3xl px-4 py-3", right ? "ml-auto rounded-br-md bg-partner-soft" : "mr-auto rounded-bl-md bg-blush", hidden && "cursor-pointer")}
              >
                <p className={cx("text-[11px] font-extrabold uppercase", right ? "text-partner" : "text-plum")}>{partnerName(state, p)}</p>
                {hidden ? (
                  <p className="my-0.5 italic text-muted">Say it in German, then tap to check…</p>
                ) : (
                  <div className="my-0.5 flex items-center gap-2">
                    <p className="flex-1 text-ink">{l.de}</p>
                    <Speak text={l.de} />
                  </div>
                )}
                {showEn || hidden ? <p className="text-sm text-muted">{meaning(l, state.partners[p].lang)}</p> : null}
              </div>
            );
          })}
        </div>
        <p className="my-4 text-center text-muted">{challenge ? "Say each line from the translation, then tap to check." : "Tip: read it twice, then swap roles."}</p>
        <Button
          size="lg"
          full
          onClick={() => {
            practiced(0, XP.dialogue);
            if (!accountMode) practiced(1, XP.dialogue);
            log("🎭", `Acted out “${d.title}” together`);
            router.push("/talk");
          }}
        >
          We did it! (+{XP.dialogue} XP)
        </Button>
      </div>
    </AppShell>
  );
}
