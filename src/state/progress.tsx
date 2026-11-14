import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState as RNAppState } from "react-native";
import type { Lang, LevelId } from "../content/levels";
import { hashPin, isValidPin, verifyPin } from "../lib/crypto";
import {
  coupleFromCode,
  LinkError,
  makeEnvelope,
  newPairCode,
  normalizeCode,
  openEnvelope,
  sealEnvelope,
  type DuelMove,
  type Envelope,
  type Payload,
  type SharedWord,
} from "../lib/link";
import { helloBox, inboxFor, otherRole, RelayError, relayConfig, relayFetch, relaySend } from "../lib/relay";
import { messageLink } from "../lib/share";
import * as C from "./couple";
import * as L from "./logic";
import type { AppState, DuelResult, PartnerIndex } from "./logic";

export * from "./logic";

const KEY = "zusammen-v2";
const POLL_MS = 5000;

export const today = () => new Date().toISOString().slice(0, 10);
export const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

/** Let the UI paint a spinner before slow crypto (PIN / code key derivation) runs. */
const nextFrame = () => new Promise((r) => setTimeout(r, 30));

export type SendResult = { delivered: true } | { delivered: false; link: string; error?: string };
export type OpenResult = { ok: true; env: Envelope; isNew: boolean } | { ok: false; error: string };
export type SyncStatus = "off" | "ok" | "offline";

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

  // PIN lock
  locked: boolean;
  unlock: (pin: string) => Promise<boolean>;
  setPin: (i: PartnerIndex, pin: string | null) => Promise<void>;

  // Couple
  relayOn: boolean;
  syncStatus: SyncStatus;
  createCode: () => Promise<string>;
  joinCode: (code: string) => Promise<{ ok: true; result: SendResult } | { ok: false; error: string }>;
  resendHello: () => Promise<SendResult | null>;
  send: (payload: Payload) => Promise<SendResult>;
  openLink: (fragment: string) => OpenResult;
  playRemoteDuel: (move: DuelMove) => Promise<SendResult>;
  addOurWord: (word: SharedWord) => Promise<SendResult | null>;
  unlink: () => void;
  syncNow: () => Promise<void>;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(L.freshState);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");
  // All writes go through update(), which keeps this ref current for async code.
  const stateRef = useRef(state);
  const relay = useMemo(() => relayConfig(), []);

  /** Update state and keep the ref in step, so async code always sees the latest. */
  const update = useCallback((fn: (s: AppState) => AppState) => {
    stateRef.current = fn(stateRef.current);
    setState(stateRef.current);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const loaded = L.migrate(JSON.parse(raw));
          stateRef.current = loaded;
          setState(loaded);
          setLocked(!!loaded.partners[loaded.learner].pin);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // ---- couple helpers ----
  const envelopeFor = useCallback((payload: Payload): Envelope => {
    const s = stateRef.current;
    return makeEnvelope(s.couple!.id, C.myInfo(s), C.statsFor(s, today(), yesterday()), payload);
  }, []);

  /** Deliver sealed text to the partner: in-app through the relay, or as a link to share. */
  const deliver = useCallback(
    async (mailbox: string | null, sealed: string): Promise<SendResult> => {
      if (relay && mailbox) {
        try {
          await relaySend(relay, mailbox, sealed);
          setSyncStatus("ok");
          return { delivered: true };
        } catch (e) {
          setSyncStatus("offline");
          return { delivered: false, link: messageLink(sealed), error: e instanceof RelayError ? e.message : "Couldn't send" };
        }
      }
      return { delivered: false, link: messageLink(sealed) };
    },
    [relay],
  );

  const send = useCallback(
    async (payload: Payload): Promise<SendResult> => {
      const s = stateRef.current;
      if (!s.couple || s.couple.status !== "linked") throw new Error("Not linked");
      const env = envelopeFor(payload);
      update((x) => C.recordOutgoing(x, env.id, payload, env.at));
      const box = inboxFor(s.couple.id, s.couple.key, otherRole(s.couple.role ?? "joiner"));
      return deliver(box, sealEnvelope(s.couple.key, env));
    },
    [deliver, envelopeFor, update],
  );

  /** Decrypt with the current key, or the pairing key for a late "hello". */
  const tryOpen = useCallback((s: AppState, sealed: string): Envelope => {
    const c = s.couple!;
    try {
      return openEnvelope(c.key, c.id, sealed);
    } catch (e) {
      if (c.previousKey) return openEnvelope(c.previousKey, c.id, sealed);
      throw e;
    }
  }, []);

  const openLink = useCallback(
    (fragment: string): OpenResult => {
      const s = stateRef.current;
      if (!s.couple) return { ok: false, error: "Link your phones first (Us tab), then open this link again." };
      if (s.couple.status === "invited" && C.codeExpired(s.couple.since, Date.now())) {
        return { ok: false, error: "Your partner code expired. Make a new one in the Us tab." };
      }
      try {
        const env = tryOpen(s, fragment);
        const r = C.receive(s, env, Date.now());
        update(() => r.state);
        return { ok: true, env, isNew: r.isNew };
      } catch (e) {
        return { ok: false, error: e instanceof LinkError ? e.message : "This link couldn't be opened." };
      }
    },
    [tryOpen, update],
  );

  // ---- polling the relay ----
  const syncNow = useCallback(async () => {
    const s = stateRef.current;
    if (!relay || !s.couple) return;
    const c = s.couple;
    if (c.status === "invited" && C.codeExpired(c.since, Date.now())) return;
    const box = c.status === "invited" ? helloBox(c.id, c.key) : inboxFor(c.id, c.key, c.role ?? "joiner");
    try {
      const rows = await relayFetch(relay, box, s.relayCursor[box] ?? 0);
      for (const row of rows) {
        try {
          const env = tryOpen(stateRef.current, row.payload);
          update((x) => C.receive(x, env, Date.now()).state);
        } catch {
          // Not for us or damaged: skip it, but don't get stuck on it.
        }
      }
      if (rows.length) update((x) => ({ ...x, relayCursor: { ...x.relayCursor, [box]: rows[rows.length - 1].id } }));
      setSyncStatus("ok");
    } catch {
      setSyncStatus("offline");
    }
  }, [relay, tryOpen, update]);

  const coupleKey = state.couple ? `${state.couple.id}:${state.couple.status}:${state.couple.key}` : "";
  useEffect(() => {
    if (!ready || !relay || !coupleKey) return;
    let busy = false;
    const tick = async () => {
      if (busy || RNAppState.currentState !== "active") return;
      busy = true;
      await syncNow();
      busy = false;
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [ready, relay, coupleKey, syncNow]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      setNames: (a, b, levels, langs) =>
        update((s) => {
          const named: AppState = {
            ...s,
            partners: [
              { ...s.partners[0], name: a, lang: langs?.[0] ?? s.partners[0].lang },
              { ...s.partners[1], name: b, lang: langs?.[1] ?? s.partners[1].lang },
            ],
          };
          return L.applyPlacement(L.applyPlacement(named, 0, levels[0]), 1, levels[1]);
        }),
      setLearner: (learner) => {
        if (stateRef.current.learner !== learner && stateRef.current.partners[learner].pin) setLocked(true);
        update((s) => ({ ...s, learner }));
      },
      setLang: (i, lang) => update((s) => L.setLang(s, i, lang)),
      recordChat: (i, chatId, stars) => update((s) => L.recordChat(s, i, chatId, stars)),
      practiced: (i, xp) => update((s) => L.applyPractice(s, i, xp, today(), yesterday())),
      markKnown: (i, unitId, w) => update((s) => L.markKnown(s, i, unitId, w)),
      recordUnitScore: (i, unitId, score) => update((s) => L.recordUnitScore(s, i, unitId, score)),
      recordExam: (i, level, score) => update((s) => L.recordExam(s, i, level, score)),
      applyPlacement: (i, idx) => update((s) => L.applyPlacement(s, i, idx)),
      addDuel: (d) => update((s) => ({ ...s, duels: [...s.duels, d].slice(-20) })),
      reset: () => {
        setLocked(false);
        update(() => L.freshState());
      },

      locked,
      unlock: async (pin) => {
        const p = stateRef.current.partners[stateRef.current.learner];
        if (!p.pin) {
          setLocked(false);
          return true;
        }
        await nextFrame();
        const ok = verifyPin(pin, p.pin);
        if (ok) setLocked(false);
        return ok;
      },
      setPin: async (i, pin) => {
        if (pin !== null && !isValidPin(pin)) throw new Error("PIN must be 4–8 digits");
        await nextFrame();
        const hashed = pin === null ? null : hashPin(pin);
        update((s) => {
          const partners = [...s.partners] as AppState["partners"];
          partners[i] = { ...partners[i], pin: hashed };
          return { ...s, partners };
        });
      },

      relayOn: !!relay,
      syncStatus: relay ? syncStatus : "off",
      createCode: async () => {
        const code = newPairCode();
        await nextFrame();
        const couple = coupleFromCode(code);
        update((s) => C.startPairing(s, code, couple, Date.now()));
        return code;
      },
      joinCode: async (input) => {
        const code = normalizeCode(input);
        if (!code) return { ok: false, error: "A code has 6 letters and numbers, like K7M-2QX." };
        await nextFrame();
        const couple = coupleFromCode(code);
        const { state: joined, codeKey, freshKey } = C.joinWithCode(stateRef.current, couple, Date.now());
        update(() => joined);
        const hello = envelopeFor({ kind: "hello", key: freshKey });
        const result = await deliver(helloBox(couple.id, codeKey), sealEnvelope(codeKey, hello));
        return { ok: true, result };
      },
      resendHello: async () => {
        const c = stateRef.current.couple;
        if (!c || c.role !== "joiner" || !c.previousKey) return null;
        const hello = envelopeFor({ kind: "hello", key: c.key });
        return deliver(helloBox(c.id, c.previousKey), sealEnvelope(c.previousKey, hello));
      },
      send,
      openLink,
      playRemoteDuel: async (move) => {
        update((s) => C.applyDuelMove(s, 0, move, Date.now(), today()));
        return send({ kind: "duel", duel: move });
      },
      addOurWord: async (word) => {
        update((s) => C.addWord(s, word));
        return C.isLinked(stateRef.current) ? send({ kind: "word", word }) : null;
      },
      unlink: () => update((s) => C.unlinkCouple(s)),
      syncNow,
    }),
    [state, ready, locked, relay, syncStatus, update, envelopeFor, deliver, send, openLink, syncNow],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}

export const currentStreak = (s: AppState) => L.streakToShow(s, today(), yesterday());

export { C as couple };
