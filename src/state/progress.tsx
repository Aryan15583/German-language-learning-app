import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang, LevelId } from "../content/levels";
import * as L from "./logic";
import type { AppState, DuelResult, PartnerIndex } from "./logic";

export * from "./logic";

const KEY = "zusammen-v2";

export const today = () => new Date().toISOString().slice(0, 10);
export const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

type Ctx = {
  state: AppState;
  ready: boolean;
  setNames: (a: string, b: string, levels: [number, number], langs?: [Lang, Lang]) => void;
  setLearner: (i: PartnerIndex) => void;
  setLang: (i: PartnerIndex, lang: Lang) => void;
  recordChat: (i: PartnerIndex, chatId: string, stars: number) => void;
  /** Award XP and keep the shared streak alive. */
  practiced: (i: PartnerIndex, xp: number) => void;
  markKnown: (i: PartnerIndex, unitId: string, wordIndex: number) => void;
  recordUnitScore: (i: PartnerIndex, unitId: string, score: number) => void;
  recordExam: (i: PartnerIndex, level: LevelId, score: number) => void;
  applyPlacement: (i: PartnerIndex, levelIdx: number) => void;
  addDuel: (d: DuelResult) => void;
  reset: () => void;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(L.freshState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState(L.migrate(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      setNames: (a, b, levels, langs) =>
        setState((s) => {
          const named: AppState = {
            ...s,
            partners: [
              { ...s.partners[0], name: a, lang: langs?.[0] ?? s.partners[0].lang },
              { ...s.partners[1], name: b, lang: langs?.[1] ?? s.partners[1].lang },
            ],
          };
          return L.applyPlacement(L.applyPlacement(named, 0, levels[0]), 1, levels[1]);
        }),
      setLearner: (learner) => setState((s) => ({ ...s, learner })),
      setLang: (i, lang) => setState((s) => L.setLang(s, i, lang)),
      recordChat: (i, chatId, stars) => setState((s) => L.recordChat(s, i, chatId, stars)),
      practiced: (i, xp) => setState((s) => L.applyPractice(s, i, xp, today(), yesterday())),
      markKnown: (i, unitId, w) => setState((s) => L.markKnown(s, i, unitId, w)),
      recordUnitScore: (i, unitId, score) => setState((s) => L.recordUnitScore(s, i, unitId, score)),
      recordExam: (i, level, score) => setState((s) => L.recordExam(s, i, level, score)),
      applyPlacement: (i, idx) => setState((s) => L.applyPlacement(s, i, idx)),
      addDuel: (d) => setState((s) => ({ ...s, duels: [...s.duels, d].slice(-20) })),
      reset: () => setState(L.freshState()),
    }),
    [state, ready],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}

export const currentStreak = (s: AppState) => L.streakToShow(s, today(), yesterday());
