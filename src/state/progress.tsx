import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LEVELS, UNLOCK_SHARE, type LevelId } from "../content/levels";

export type PartnerIndex = 0 | 1;

export type Partner = {
  name: string;
  xp: number;
  /** Highest unlocked level (index into LEVELS). */
  unlocked: number;
  /** Mastered word indexes per topic id. */
  known: Record<string, number[]>;
};

export type DuelResult = { title: string; scores: [number, number]; date: string };

export type AppState = {
  partners: [Partner, Partner];
  learner: PartnerIndex;
  streak: { count: number; last: string | null };
  duels: DuelResult[];
};

const KEY = "zusammen-v2";

const newPartner = (): Partner => ({ name: "", xp: 0, unlocked: 0, known: {} });
const fresh = (): AppState => ({
  partners: [newPartner(), newPartner()],
  learner: 0,
  streak: { count: 0, last: null },
  duels: [],
});

export const today = () => new Date().toISOString().slice(0, 10);
export const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

type Ctx = {
  state: AppState;
  ready: boolean;
  setNames: (a: string, b: string, levels: [number, number]) => void;
  setLearner: (i: PartnerIndex) => void;
  /** Award XP and keep the shared streak alive. */
  practiced: (i: PartnerIndex, xp: number) => void;
  markKnown: (i: PartnerIndex, topicId: string, wordIndex: number) => void;
  unlockLevel: (i: PartnerIndex, levelIndex: number) => void;
  addDuel: (d: DuelResult) => void;
  reset: () => void;
};

const ProgressContext = createContext<Ctx | null>(null);

/** Index of the highest level a partner has earned by mastering words. */
function earnedLevel(p: Partner): number {
  let earned = 0;
  for (let i = 0; i < LEVELS.length - 1; i++) {
    const total = LEVELS[i].topics.reduce((n, t) => n + t.words.length, 0);
    const known = LEVELS[i].topics.reduce((n, t) => n + (p.known[t.id]?.length ?? 0), 0);
    if (known / total >= UNLOCK_SHARE) earned = i + 1;
    else break;
  }
  return earned;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(fresh);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...fresh(), ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const updatePartner = useCallback((i: PartnerIndex, fn: (p: Partner) => Partner) => {
    setState((s) => {
      const partners = [...s.partners] as [Partner, Partner];
      partners[i] = fn(partners[i]);
      return { ...s, partners };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      setNames: (a, b, levels) =>
        setState((s) => ({
          ...s,
          partners: [
            { ...s.partners[0], name: a, unlocked: Math.max(s.partners[0].unlocked, levels[0]) },
            { ...s.partners[1], name: b, unlocked: Math.max(s.partners[1].unlocked, levels[1]) },
          ],
        })),
      setLearner: (learner) => setState((s) => ({ ...s, learner })),
      practiced: (i, xp) =>
        setState((s) => {
          const partners = [...s.partners] as [Partner, Partner];
          partners[i] = { ...partners[i], xp: partners[i].xp + xp };
          const t = today();
          const streak =
            s.streak.last === t
              ? s.streak
              : { count: s.streak.last === yesterday() ? s.streak.count + 1 : 1, last: t };
          return { ...s, partners, streak };
        }),
      markKnown: (i, topicId, wordIndex) =>
        updatePartner(i, (p) => {
          const known = { ...p.known, [topicId]: Array.from(new Set([...(p.known[topicId] ?? []), wordIndex])) };
          const next = { ...p, known };
          return { ...next, unlocked: Math.max(p.unlocked, earnedLevel(next)) };
        }),
      unlockLevel: (i, levelIndex) => updatePartner(i, (p) => ({ ...p, unlocked: Math.max(p.unlocked, levelIndex) })),
      addDuel: (d) => setState((s) => ({ ...s, duels: [...s.duels, d].slice(-20) })),
      reset: () => setState(fresh()),
    }),
    [state, ready, updatePartner],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}

// ---- Derived helpers ----
export const partnerName = (s: AppState, i: PartnerIndex) => s.partners[i].name || (i ? "Partner B" : "Partner A");

export const knownInTopic = (p: Partner, topicId: string) => p.known[topicId]?.length ?? 0;

export function levelProgress(p: Partner, levelId: LevelId) {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const total = level.topics.reduce((n, t) => n + t.words.length, 0);
  const known = level.topics.reduce((n, t) => n + knownInTopic(p, t.id), 0);
  return { known, total, share: total ? known / total : 0 };
}

export const currentStreak = (s: AppState) =>
  s.streak.last === today() || s.streak.last === yesterday() ? s.streak.count : 0;
