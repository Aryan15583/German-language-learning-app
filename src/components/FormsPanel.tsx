import { indefinite, PERSONS, pastFor, possessive, type FormEntry } from "../core/lib/forms";
import type { Lang } from "../core/content/levels";
import { Speak, cx } from "./ui";

/** How one word changes: verb endings, plural, "more / most". Tap any form to hear it. */
export function FormsPanel({ entry, lang, compact }: { entry: FormEntry; lang: Lang; compact?: boolean }) {
  const mr = lang !== "en";
  if (entry.pos === "verb") {
    return (
      <div className={cx("rounded-2xl bg-blush/60 p-3", compact && "text-sm")}>
        <Head title={entry.lemma} tag="verb · क्रियापद" sub={mr ? `${entry.mr} · ${entry.en}` : entry.en} />
        <p className="mb-2 text-xs text-muted">{mr ? "मराठीसारखंच: मी जातो · तू जातोस · ते जातात — जर्मनमध्येही शेवट बदलतो." : "Like Marathi (मी जातो · तू जातोस · ते जातात), the ending changes with the person."}</p>
        <table className="w-full text-left">
          <tbody>
            {entry.present.map((f, k) => (
              <Row key={k} left={PERSONS[k]} right={f} say={`${PERSONS[k].split(" ")[0]} ${f}`} />
            ))}
            <Row left={mr ? "भूतकाळ (past)" : "past"} right={pastFor(entry).split(" ").slice(1).join(" ")} say={pastFor(entry)} strong />
          </tbody>
        </table>
      </div>
    );
  }
  if (entry.pos === "noun") {
    const plural = entry.plural ?? (mr ? "अनेकवचन नाही (no plural)" : "no plural");
    return (
      <div className={cx("rounded-2xl bg-blush/60 p-3", compact && "text-sm")}>
        <Head title={entry.lemma} tag={`noun · ${entry.article === "der" ? "masculine" : entry.article === "die" ? "feminine" : "neuter"}`} sub={entry.en} />
        <p className="mb-2 text-xs text-muted">{mr ? "मराठीसारखं: घर → घरे. जर्मनमध्ये: Haus → Häuser." : "Like Marathi घर → घरे, German nouns change for more than one."}</p>
        <table className="w-full text-left">
          <tbody>
            <Row left="the" right={entry.lemma} say={entry.lemma} />
            <Row left="a" right={`${indefinite(entry)} ${entry.word}`} say={`${indefinite(entry)} ${entry.word}`} />
            <Row left="my" right={`${possessive(entry)} ${entry.word}`} say={`${possessive(entry)} ${entry.word}`} />
            <Row left={mr ? "अनेक (plural)" : "plural"} right={plural} say={entry.plural ?? undefined} strong />
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className={cx("rounded-2xl bg-blush/60 p-3", compact && "text-sm")}>
      <Head title={entry.lemma} tag="adjective · विशेषण" sub={mr ? `${entry.mr} · ${entry.en}` : entry.en} />
      {entry.comparative ? (
        <>
          <p className="mb-2 text-xs text-muted">{mr ? "चांगला → जास्त चांगला → सगळ्यात चांगला = gut → besser → am besten" : "good → better → the best, the German way."}</p>
          <table className="w-full text-left">
            <tbody>
              <Row left={mr ? "साधा" : "base"} right={entry.lemma} say={entry.lemma} />
              <Row left={mr ? "जास्त" : "more"} right={entry.comparative} say={entry.comparative} />
              <Row left={mr ? "सगळ्यात" : "most"} right={entry.superlative ?? ""} say={entry.superlative ?? undefined} strong />
            </tbody>
          </table>
        </>
      ) : (
        <p className="text-sm text-muted">{mr ? "हा शब्द तुलना करत नाही — जसा आहे तसाच वापरा." : "This one doesn't compare — use it as it is."}</p>
      )}
    </div>
  );
}

function Head({ title, tag, sub }: { title: string; tag: string; sub: string }) {
  return (
    <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
      <span className="text-lg font-extrabold text-plum">{title}</span>
      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">{tag}</span>
      <span className="text-sm text-muted">{sub}</span>
    </div>
  );
}

function Row({ left, right, say, strong }: { left: string; right: string; say?: string; strong?: boolean }) {
  return (
    <tr className="border-t border-line/50 first:border-0">
      <td className="w-28 py-1.5 pr-3 text-sm text-muted">{left}</td>
      <td className={cx("py-1.5 font-semibold text-ink", strong && "text-plum")}>{right}</td>
      <td className="w-10 py-1 text-right">{say ? <Speak text={say} className="!h-7 !w-7" /> : null}</td>
    </tr>
  );
}
