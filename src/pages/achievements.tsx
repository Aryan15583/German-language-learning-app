import { AppShell } from "../components/AppShell";
import { Card, cx, Script } from "../components/ui";
import { ACHIEVEMENTS } from "../core/lib/game";
import { couple, currentStreak, partnerName, useProgress, type PartnerIndex } from "../web/progress";
import { hasPartner } from "../web/stats";

/** Achievements: collect them together — who gets more? */
export default function Achievements() {
  const { state, accountMode } = useProgress();
  const streak = currentStreak(state);
  const both = hasPartner(state, accountMode);
  const people: PartnerIndex[] = both ? [0, 1] : [state.learner];
  const ctx = ([0, 1] as PartnerIndex[]).map((i) => couple.achievementContext(state, i, streak));
  const count = (i: PartnerIndex) => ACHIEVEMENTS.filter((a) => a.test(ctx[i])).length;
  return (
    <AppShell>
      <Script className="text-4xl">Achievements 🏅</Script>
      <p className="text-muted">{both ? `Collect them together — who gets more, ${partnerName(state, 0)} or ${partnerName(state, 1)}?` : "Collect them all!"}</p>
      <div className="mt-3 flex gap-3">
        {people.map((i) => (
          <span key={i} className={cx("rounded-full px-4 py-1.5 text-sm font-bold text-white", i ? "bg-partner" : "bg-plum")}>
            {partnerName(state, i)}: {count(i)} / {ACHIEVEMENTS.length}
          </span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = people.map((i) => a.test(ctx[i]));
          const any = got.some(Boolean);
          return (
            <Card key={a.id} className={cx("flex flex-col items-center p-4 text-center", !any && "opacity-55")}>
              <span className={cx("grid h-16 w-16 place-items-center rounded-full text-3xl", any ? "bg-blush" : "bg-line/50")}>{any ? a.emoji : "🔒"}</span>
              <p className="mt-2 font-bold">{a.title}</p>
              <p className="text-xs text-muted">{a.desc}</p>
              <div className="mt-2 flex gap-1.5">
                {people.map((i, k) => (
                  <span
                    key={i}
                    aria-label={`${got[k] ? "Earned" : "Not yet"} by ${partnerName(state, i)}`}
                    className={cx("grid h-6 w-6 place-items-center rounded-full text-[11px] font-extrabold text-white", got[k] ? (i ? "bg-partner" : "bg-plum") : "bg-line")}
                  >
                    {partnerName(state, i).slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
