import { daysThisWeek, weeklyChallenges, weeklyProgress, WEEKLY_POOL } from "../lib/weekly";
import { claimWeekly, countUp, freshState, migrate, rollWeek } from "../state/logic";

describe("weekly challenges", () => {
  it("4 per week, the same on both phones, always with together XP and days", () => {
    const a = weeklyChallenges("2026-W47").map((c) => c.id);
    expect(a).toHaveLength(4);
    expect(a.slice(0, 2)).toEqual(["xpTogether", "days"]);
    expect(weeklyChallenges("2026-W47").map((c) => c.id)).toEqual(a);
    expect(new Set(a).size).toBe(4);
  });
  it("counts only what happened since the week started", () => {
    let s = countUp(countUp(freshState(), 0, "duels"), 0, "duels"); // last week
    s = rollWeek(s, "2026-11-18");
    expect(s.partners[0].weekly).toMatchObject({ id: "2026-W47", base: { duels: 2 } });
    expect(rollWeek(s, "2026-11-19")).toBe(s); // same week: nothing changes
    s = countUp(s, 0, "duels");
    const duel = WEEKLY_POOL.find((c) => c.id === "duels")!;
    const p = s.partners[0];
    expect(weeklyProgress(duel, { myWeekXp: 0, theirWeekXp: 0, days: 0, counts: p.counts, base: p.weekly!.base })).toBe(1);
    // A new week starts from zero again.
    const next = rollWeek(s, "2026-11-23");
    expect(next.partners[0].weekly).toMatchObject({ id: "2026-W48", base: { duels: 3 }, claimed: [] });
  });
  it("days this week come from the XP history", () => {
    expect(daysThisWeek({ "2026-11-16": 10, "2026-11-17": 0, "2026-11-18": 5, "2026-11-15": 9 }, "2026-11-18")).toBe(2);
  });
  it("a challenge can be claimed once per week for +XP, and survives a reload", () => {
    let s = rollWeek(freshState(), "2026-11-18");
    s = claimWeekly(s, 0, "duels", 50, "2026-11-18");
    expect(s.partners[0].xp).toBe(50);
    expect(claimWeekly(s, 0, "duels", 50, "2026-11-18")).toBe(s);
    expect(migrate(JSON.parse(JSON.stringify(s))).partners[0].weekly?.claimed).toEqual(["duels"]);
  });
});
