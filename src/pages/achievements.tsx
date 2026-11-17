import { AppShell } from "../components/AppShell";
import { Card, cx, Script } from "../components/ui";
import { ACHIEVEMENTS, COUPLE_ACHIEVEMENTS } from "../core/lib/game";
import { postcards } from "../core/lib/journey";
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
      <CoupleBadges />
      <h2 className="mb-1 mt-8 text-lg font-bold">Just you</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

function CoupleBadges() {
  const { state, accountMode } = useProgress();
  const streak = currentStreak(state);
  const c = couple.coupleContext(state, streak, hasPartner(state, accountMode), postcards(state.partners[state.learner]).length);
  const got = COUPLE_ACHIEVEMENTS.filter((a) => a.test(c)).length;
  return (
    <>
      <h2 className="mb-1 mt-6 text-lg font-bold">💞 Together ({got} / {COUPLE_ACHIEVEMENTS.length})</h2>
      <p className="text-sm text-muted">Earned as a couple.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COUPLE_ACHIEVEMENTS.map((a) => {
          const ok = a.test(c);
          return (
            <Card key={a.id} className={cx("flex flex-col items-center p-4 text-center", ok ? "bg-gradient-to-br from-card to-blush" : "opacity-55")}>
              <span className={cx("grid h-16 w-16 place-items-center rounded-full text-3xl", ok ? "bg-white" : "bg-line/50")}>{ok ? a.emoji : "🔒"}</span>
              <p className="mt-2 font-bold">{a.title}</p>
              <p className="text-xs text-muted">{a.desc}</p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
