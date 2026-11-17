// The daily couple mission: four small things, one reward.

export type Mission = { date: string; words: number; talks: number; duels: number; notes: number; claimed: boolean };
export type MissionKind = "words" | "talks" | "duels" | "notes";

export const MISSION_GOALS: Record<MissionKind, number> = { words: 5, talks: 1, duels: 1, notes: 1 };
export const MISSION_XP = 100;

export const LABELS: Record<MissionKind, string> = {
  words: "Learn 5 words",
  talks: "Complete 1 conversation",
  duels: "Play a duel",
  notes: "Send a German love note",
};

export const freshMission = (date: string): Mission => ({ date, words: 0, talks: 0, duels: 0, notes: 0, claimed: false });

/** Today's mission (a new one each day). */
export const missionFor = (m: Mission | null | undefined, today: string): Mission => (m && m.date === today ? m : freshMission(today));

export const bump = (m: Mission | null | undefined, kind: MissionKind, today: string, n = 1): Mission => {
  const cur = missionFor(m, today);
  return { ...cur, [kind]: cur[kind] + n };
};

export const missionTasks = (m: Mission) =>
  (Object.keys(MISSION_GOALS) as MissionKind[]).map((k) => ({ id: k, label: LABELS[k], have: Math.min(m[k], MISSION_GOALS[k]), need: MISSION_GOALS[k], done: m[k] >= MISSION_GOALS[k] }));

export const missionComplete = (m: Mission) => missionTasks(m).every((t) => t.done);
