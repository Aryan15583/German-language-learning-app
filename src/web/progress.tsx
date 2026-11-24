import AsyncStorage from "./storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Lang, LevelId } from "../core/content/levels";
import { hashPin, isValidPin, newId, verifyPin } from "../core/lib/crypto";
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
} from "../core/lib/link";
import { helloBox, inboxFor, offerBox, presenceBox, presenceClear, presenceGet, presenceSet, otherRole, RelayError, relayClear, relayConfig, relayFetch, relaySend } from "../core/lib/relay";
import { newDhPair } from "../core/lib/pair";
import { messageLink } from "./share";
import { WEEKLY_XP } from "../core/lib/weekly";
import { deleteMedia, mediaLabel, mediaUrl } from "./media";
import { clearLocal, deleteLocal, deleteLocalUpTo } from "./mediaStore";
import { getPrefs, usePrefs } from "./prefs";
import { HEARTBEAT_MS, openPresence, sealPresence, type Presence } from "../core/lib/presence";
import { pinWaitSeconds, recordPinTry } from "./pinGuard";
import { disableNotifications, enableNotifications, ensurePush, localReminderCheck, reportLearned, setReminder, type Reminder, notifyStatus, notifyWanted, rememberPartnerName, showMessageNotification, type NotifyStatus } from "./notify";
import { archiveDiff, type ArchiveStats } from "../core/lib/archive";
import { archiveName, askToKeepData, ChatArchive } from "./chatStore";
import * as C from "../core/state/couple";
import * as L from "../core/state/logic";
import type { AppState, ChatItem, DuelResult, PartnerIndex } from "../core/state/logic";

export * from "../core/state/logic";

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
  /** Accounts on: this phone belongs to one person (partner 0); partner 1 is the linked partner. */
  accountMode: boolean;
  setNames: (a: string, b: string, levels: [number, number], langs?: [Lang, Lang]) => void;
  setLearner: (i: PartnerIndex) => void;
  setLang: (i: PartnerIndex, lang: Lang) => void;
  recordChat: (i: PartnerIndex, chatId: string, stars: number) => void;
  /** Award XP and keep the shared streak alive. */
  practiced: (i: PartnerIndex, xp: number) => void;
  /** `key` (the German) also starts the word's review schedule. */
  markKnown: (i: PartnerIndex, unitId: string, wordIndex: number, key?: string) => void;
  recordUnitScore: (i: PartnerIndex, unitId: string, score: number) => void;
  recordExam: (i: PartnerIndex, level: LevelId, score: number) => void;
  applyPlacement: (i: PartnerIndex, levelIdx: number) => void;
  addDuel: (d: DuelResult) => void;
  /** Remember something for "Recent activity". */
  log: (icon: string, text: string) => void;
  /** A quiz answer about a word: update its review schedule. */
  remember: (i: PartnerIndex, key: string, correct: boolean, slow?: boolean) => void;
  markPractised: (i: PartnerIndex, unitId: string) => void;
  /** Count something for today's mission and the couple achievements. */
  did: (i: PartnerIndex, what: "talk" | "duel" | "perfect" | "note") => void;
  claimMission: (i: PartnerIndex) => void;
  /** Timer for new chat messages. */
  setVanish: (v: AppState["vanish"]) => void;
  /** Message notifications: turn on (asks permission) or off. `push` = also when the app is closed. */
  enableNotify: () => Promise<{ status: NotifyStatus; push: boolean }>;
  disableNotify: () => Promise<void>;
  /** Daily learning reminder at a time of day. */
  saveReminder: (r: Reminder) => Promise<{ ok: boolean; push: boolean; status: NotifyStatus }>;
  /** My partner's "online / last seen" (null: unknown, or switched off). */
  partnerPresence: Presence | null;
  /** Claim a finished weekly challenge (+50 XP). */
  claimWeekly: (id: string) => void;
  /** Clear the chat on this phone, or on both phones. */
  clearChat: (forBoth: boolean) => Promise<void>;
  /** Edit or delete one of my own chat messages (on both phones). */
  editMessage: (msgId: string, text: string) => void;
  unsendMessage: (msgId: string) => void;
  /** React to a chat message with an emoji ("" removes my reaction). */
  react: (msgId: string, emoji: string) => void;
  /** Our memory book. */
  addMemory: (m: { emoji: string; title: string; text: string; at?: number }) => void;
  removeMemory: (id: string) => void;
  /** I'm reading the chat: start "after seen" countdowns and tell my partner. */
  viewMessages: () => void;
  /** I left the chat: "after seen" messages I've read disappear now. */
  leaveChat: () => void;
  /** The full chat history on this phone (null where the browser has no database). */
  archive: { before: (at: number, limit: number) => Promise<ChatItem[]>; stats: () => Promise<ArchiveStats>; search: (term: string) => Promise<ChatItem[]> } | null;
  finishReadyDay: (i: PartnerIndex, day: number) => void;
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
  dismissWelcome: () => void;
};

const ProgressContext = createContext<Ctx | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Where this phone keeps the progress (one key per account in account mode). */
  storageKey?: string;
  /** Start from this (e.g. a decrypted cloud backup) instead of this phone's copy. */
  initial?: unknown;
  /** Called after every change, e.g. to update the encrypted cloud backup. */
  onChange?: (state: AppState) => void;
  /** Accounts on: one person per phone. */
  accountMode?: boolean;
};

export function ProgressProvider({ children, storageKey = KEY, initial = null, onChange, accountMode = false }: ProviderProps) {
  const [state, setState] = useState<AppState>(L.freshState);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");
  // All writes go through update(), which keeps this ref current for async code.
  const stateRef = useRef(state);
  const relay = useMemo(() => relayConfig(), []);

  /** Update state and keep the ref in step, so async code always sees the latest. */
  const update = useCallback((fn: (s: AppState) => AppState) => {
    // A new week starts counting before anything else happens.
    const next = fn(L.rollWeek(stateRef.current, today()));
    if (next === stateRef.current) return;
    stateRef.current = { ...next, updatedAt: Date.now() };
    setState(stateRef.current);
  }, []);

  useEffect(() => {
    const load = initial ? Promise.resolve(JSON.stringify(initial)) : AsyncStorage.getItem(storageKey);
    load
      .then((raw) => {
        if (raw) {
          let loaded = L.migrate(JSON.parse(raw));
          if (accountMode) loaded = { ...loaded, learner: 0 };
          // "After seen" messages read during an earlier visit are gone now.
          loaded = C.purgeExpired(C.leaveChat(loaded), Date.now());
          stateRef.current = loaded;
          setState(loaded);
          setLocked(!!loaded.partners[loaded.learner].pin);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- load once per account

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => {});
    onChangeRef.current?.(state);
  }, [state, ready, storageKey]);

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
      update((x) => {
        const sent = C.recordOutgoing(x, env.id, payload, env.at);
        return payload.kind === "note" ? L.bumpMission(L.countUp(sent, 0, "notes"), 0, "notes", today()) : sent;
      });
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
      const fresh: Envelope[] = [];
      for (const row of rows) {
        try {
          const env = tryOpen(stateRef.current, row.payload);
          if (!stateRef.current.seen.includes(env.id)) fresh.push(env);
          // My partner deleted a photo/video/voice message: remove my saved copy too.
          if (env.kind === "unsend") {
            const gone = stateRef.current.chat.find((m) => m.id === env.to && m.from === 1);
            if (gone?.media) deleteLocal(gone.media.path).catch(() => {});
          }
          update((x) => C.receive(x, env, Date.now()).state);
        } catch {
          // Not for us or damaged: skip it, but don't get stuck on it.
        }
      }
      if (rows.length) update((x) => ({ ...x, relayCursor: { ...x.relayCursor, [box]: rows[rows.length - 1].id } }));
      setSyncStatus("ok");
      // Like Signal: fetch new photos, videos and voice messages now, keep them on this phone, and let the server forget them.
      for (const e of fresh) if (e.kind === "media") mediaUrl(e.media, 1, e.at).catch(() => {});
      // Just linked as the code maker: empty the pairing mailboxes so nothing about it stays on the server.
      if (c.status === "invited" && stateRef.current.couple?.status === "linked") {
        relayClear(relay, helloBox(c.id, c.key)).catch(() => {});
        relayClear(relay, offerBox(c.id, c.key)).catch(() => {});
      }
      // The app is open but not on screen (or not on the chat): show a phone notification.
      const shown = fresh.filter((e) => ["msg", "note", "secret", "word", "duel", "media"].includes(e.kind));
      const onChat = typeof window !== "undefined" && window.location.pathname.startsWith("/messages") && document.visibilityState === "visible";
      if (shown.length && !onChat && (typeof document === "undefined" || document.visibilityState !== "visible")) {
        const last = shown[shown.length - 1];
        const body =
          shown.length > 1
            ? `${shown.length} new messages 💌`
            : last.kind === "msg"
              ? last.vanish
                ? "⏱ Disappearing message"
                : last.text
              : last.kind === "note"
                ? `💌 ${last.text}`
                : last.kind === "media"
                  ? `${mediaLabel(last.media)}${last.text ? `: ${last.text}` : ""}`
                  : last.kind === "secret"
                  ? "🔒 Sent you a secret"
                  : last.kind === "word"
                    ? `📖 New word: ${last.word.de}`
                    : "⚔️ New duel move";
        showMessageNotification(last.from.name || "Zwei Herzen ♡", body.slice(0, 180));
      }
    } catch {
      setSyncStatus("offline");
    }
  }, [relay, tryOpen, update]);

  const coupleKey = state.couple ? `${state.couple.id}:${state.couple.status}:${state.couple.key}` : "";
  useEffect(() => {
    if (!ready || !relay || !coupleKey) return;
    let busy = false;
    let lastHidden = 0;
    const tick = async () => {
      if (busy) return;
      // In the background, check every 30 s for notifications (phones may slow this down further).
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        if (!notifyWanted() || Date.now() - lastHidden < 30_000) return;
        lastHidden = Date.now();
      }
      busy = true;
      await syncNow();
      busy = false;
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [ready, relay, coupleKey, syncNow]);

  // Keep closed-app pings pointed at my current mailbox (after linking or re-linking).
  const linkedBox = state.couple?.status === "linked" ? inboxFor(state.couple.id, state.couple.key, state.couple.role ?? "joiner") : null;
  const partnerShown = L.partnerName(state, 1);
  useEffect(() => {
    if (!ready || !linkedBox || notifyStatus() !== "on") return;
    rememberPartnerName(partnerShown);
    ensurePush(relay, linkedBox);
  }, [ready, relay, linkedBox, partnerShown]);

  // Reminders: tell the server once I've learned today; and remind from here while the app is open in the background.
  const meToday = state.partners[state.learner].today;
  const learnedToday = meToday.date === today() && meToday.xp > 0;
  useEffect(() => {
    if (ready && learnedToday) reportLearned(relay, today());
  }, [ready, relay, learnedToday]);
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const t = stateRef.current.partners[stateRef.current.learner].today;
      localReminderCheck(t.date === today() && t.xp > 0, today());
    }, 60_000);
    return () => clearInterval(id);
  }, [ready]);

  // App lock: with a PIN, lock again after the app was in the background a while (Me → Privacy).
  useEffect(() => {
    if (!ready) return;
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const s = stateRef.current;
      const after = getPrefs().lockAfter;
      if (!hiddenAt || after === "never" || !s.partners[s.learner].pin) return;
      if (Date.now() - hiddenAt >= Number(after) * 60_000) setLocked(true);
      hiddenAt = 0;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [ready]);

  // ---- online / last seen (encrypted; see 0008_presence.sql) ----
  const [partnerPresence, setPartnerPresence] = useState<Presence | null>(null);
  const [prefsNow] = usePrefs();
  const shareSeen = prefsNow.lastSeen;
  useEffect(() => {
    const c = state.couple;
    if (!ready || !relay || !c || c.status !== "linked") return;
    const role = c.role ?? "joiner";
    const mine = presenceBox(c.id, c.key, role);
    const theirs = presenceBox(c.id, c.key, otherRole(role));
    if (!shareSeen) {
      // Off, like WhatsApp: I don't share mine, and I don't see theirs.
      presenceClear(relay, mine).catch(() => {});
      return;
    }
    const say = (online: boolean) => presenceSet(relay, mine, sealPresence(c.key, { at: Date.now(), online })).catch(() => {});
    const look = () =>
      presenceGet(relay, theirs)
        .then((p) => setPartnerPresence(openPresence(c.key, p, Date.now())))
        .catch(() => {});
    let beat: ReturnType<typeof setInterval> | null = null;
    let peek: ReturnType<typeof setInterval> | null = null;
    const here = () => {
      say(true);
      look();
      beat ??= setInterval(() => say(true), HEARTBEAT_MS);
      peek ??= setInterval(look, 15_000);
    };
    const away = () => {
      say(false);
      if (beat) clearInterval(beat);
      if (peek) clearInterval(peek);
      beat = peek = null;
    };
    const onVis = () => (document.visibilityState === "visible" ? here() : away());
    if (document.visibilityState === "visible") here();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", away);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", away);
      away();
    };
  }, [ready, relay, coupleKey, shareSeen]); // eslint-disable-line react-hooks/exhaustive-deps -- re-run when the couple changes

  // ---- chat archive (IndexedDB): the full history, saved in the background ----
  const [archive] = useState(() => (typeof indexedDB === "undefined" ? null : new ChatArchive(archiveName(storageKey))));
  const archived = useRef<AppState["chat"] | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    if (!ready || !archive) return;
    const prev = archived.current ?? [];
    const next = state.chat;
    archived.current = next;
    const { put, del } = archiveDiff(prev, next);
    if (!put.length && !del.length) return;
    queue.current = queue.current
      .then(() => archive.apply(put, del))
      .then(() => archive.trim())
      .catch(() => {}); // a full or blocked database must never break the app
    if (prev.length === 0 && next.length) askToKeepData();
  }, [ready, archive, state.chat]);

  // "Clear chat" (mine or my partner's): also delete the older messages kept in the archive.
  useEffect(() => {
    if (!ready || !archive || !state.chatClearedAt) return;
    queue.current = queue.current.then(() => archive.deleteUpTo(state.chatClearedAt)).catch(() => {});
    deleteLocalUpTo(state.chatClearedAt).catch(() => {});
  }, [ready, archive, state.chatClearedAt]);

  // Disappearing messages: clear out anything whose time is up (now, and every 30 s).
  useEffect(() => {
    if (!ready) return;
    const purge = () => {
      update((s) => C.purgeExpired(s, Date.now()));
      if (archive) queue.current = queue.current.then(() => archive.purgeExpired(Date.now())).catch(() => {});
    };
    purge();
    const id = setInterval(purge, 30_000);
    return () => clearInterval(id);
  }, [ready, update, archive]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      accountMode,
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
      markKnown: (i, unitId, w, key?: string) =>
        update((s) => {
          const isNew = !(s.partners[i].known[unitId] ?? []).includes(w);
          let next = L.markKnown(s, i, unitId, w);
          if (key) next = L.meetWord(next, i, key, today());
          return isNew ? L.bumpMission(next, i, "words", today()) : next;
        }),
      recordUnitScore: (i, unitId, score) => update((s) => L.recordUnitScore(s, i, unitId, score)),
      recordExam: (i, level, score) => update((s) => L.recordExam(s, i, level, score)),
      applyPlacement: (i, idx) => update((s) => L.applyPlacement(s, i, idx)),
      addDuel: (d) => update((s) => ({ ...s, duels: [...s.duels, d].slice(-20) })),
      log: (icon, text) => update((s) => L.logActivity(s, icon, text, Date.now())),
      remember: (i, key, correct, slow) => update((s) => L.remember(s, i, key, correct, today(), slow)),
      markPractised: (i, unitId) => update((s) => L.markPractised(s, i, unitId)),
      did: (i, what) =>
        update((s) =>
          what === "talk"
            ? L.bumpMission(L.countUp(s, i, "talks"), i, "talks", today())
            : what === "duel"
              ? L.bumpMission(L.countUp(s, i, "duels"), i, "duels", today())
              : what === "note"
                ? L.bumpMission(L.countUp(s, i, "notes"), i, "notes", today())
                : L.countUp(s, i, "perfect"),
        ),
      claimMission: (i) => update((s) => L.claimMission(s, i, today())),
      setVanish: (v) => update((s) => (s.vanish === v ? s : { ...s, vanish: v })),
      enableNotify: () => {
        const c = stateRef.current.couple;
        const box = c && c.status === "linked" ? inboxFor(c.id, c.key, c.role ?? "joiner") : null;
        return enableNotifications(relay, box, L.partnerName(stateRef.current, 1));
      },
      disableNotify: () => disableNotifications(relay),
      saveReminder: (r) => setReminder(relay, r),
      partnerPresence: shareSeen && C.isLinked(state) ? partnerPresence : null,
      claimWeekly: (id) => update((s) => L.claimWeekly(s, s.learner, id, WEEKLY_XP, today())),
      clearChat: async (forBoth) => {
        const at = Date.now();
        if (forBoth && C.isLinked(stateRef.current)) await send({ kind: "clear", before: at }).catch(() => undefined);
        else update((s) => L.clearChat(s, at, "You cleared this chat on your phone 🧹", at));
      },
      editMessage: (msgId, text) => {
        if (C.isLinked(stateRef.current)) send({ kind: "edit", to: msgId, text }).catch(() => {});
        else update((s) => L.editMessage(s, msgId, 0, text, Date.now()));
      },
      unsendMessage: (msgId) => {
        const gone = stateRef.current.chat.find((m) => m.id === msgId && m.from === 0);
        if (gone?.media) {
          deleteMedia(gone.media.path).catch(() => {});
          deleteLocal(gone.media.path).catch(() => {});
        }
        if (C.isLinked(stateRef.current)) send({ kind: "unsend", to: msgId }).catch(() => {});
        else update((s) => L.unsendMessage(s, msgId, 0));
        archive?.apply([], [msgId]).catch(() => {});
      },
      react: (msgId, emoji) => {
        if (C.isLinked(stateRef.current)) send({ kind: "react", to: msgId, emoji }).catch(() => {});
        else update((s) => L.setReaction(s, msgId, 0, emoji));
      },
      addMemory: (m) => update((s) => L.addMemory(s, { id: newId(), at: m.at ?? Date.now(), emoji: m.emoji, title: m.title, text: m.text })),
      removeMemory: (id) => update((s) => L.removeMemory(s, id)),
      viewMessages: () => {
        const { state: next, ids } = C.markViewed(stateRef.current, Date.now());
        if (ids.length) {
          update(() => next);
          // Let my partner's phone delete its copy too (only when it can arrive in-app).
          if (relay && C.isLinked(stateRef.current)) send({ kind: "viewed", ids: ids.slice(0, 50) }).catch(() => {});
        }
        // Read receipts (✓✓), once per batch of new messages.
        const s = stateRef.current;
        const latest = s.chat.reduce((t, m) => (m.from === 1 && m.kind !== "system" && m.at > t ? m.at : t), 0);
        if (relay && C.isLinked(s) && getPrefs().readReceipts && latest > s.myReadSent) send({ kind: "read", upTo: latest }).catch(() => {});
      },
      leaveChat: () => update((s) => C.leaveChat(s)),
      archive: archive ? { before: (at, limit) => archive.before(at, limit), stats: () => archive.stats(), search: (term) => archive.search(term) } : null,
      finishReadyDay: (i, day) => update((s) => L.finishReadyDay(s, i, day)),
      reset: () => {
        setLocked(false);
        archived.current = [];
        if (archive) queue.current = queue.current.then(() => archive.clear()).catch(() => {});
        clearLocal().catch(() => {});
        update(() => L.freshState());
      },

      locked,
      unlock: async (pin) => {
        const p = stateRef.current.partners[stateRef.current.learner];
        if (!p.pin) {
          setLocked(false);
          return true;
        }
        if (pinWaitSeconds() > 0) return false;
        await nextFrame();
        const ok = verifyPin(pin, p.pin);
        recordPinTry(ok);
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
        if (!relay) {
          // Without the in-app relay, pairing uses links (older method).
          update((s) => C.startPairing(s, code, couple, Date.now()));
          return code;
        }
        // Safe pairing: leave my one-time public key for my partner, encrypted with the code key.
        const dh = newDhPair();
        update((s) => C.startPairing(s, code, couple, Date.now(), dh));
        const offer = envelopeFor({ kind: "offer", pub: dh.pub });
        await deliver(offerBox(couple.id, couple.key), sealEnvelope(couple.key, offer));
        return code;
      },
      joinCode: async (input) => {
        const code = normalizeCode(input);
        if (!code) return { ok: false, error: "A code has 6 letters and numbers, like K7M-2QX." };
        await nextFrame();
        const couple = coupleFromCode(code);
        if (relay) {
          // Safe pairing: find my partner's public key for this code.
          let creatorPub: string | null = null;
          try {
            const rows = await relayFetch(relay, offerBox(couple.id, couple.key), 0);
            for (const row of rows) {
              try {
                const env = openEnvelope(couple.key, couple.id, row.payload);
                if (env.kind === "offer") creatorPub = env.pub;
              } catch {
                // not a valid offer: skip
              }
            }
          } catch {
            return { ok: false, error: "Can’t reach the internet right now. Try again in a moment." };
          }
          if (!creatorPub) return { ok: false, error: "That code wasn’t found. Check it, or ask your partner for a new one (codes last 24 hours, and both phones need the latest app)." };
          const { state: joined, codeKey, pub } = C.joinSafely(stateRef.current, couple, creatorPub, Date.now());
          update(() => joined);
          const join = envelopeFor({ kind: "join", pub });
          const result = await deliver(helloBox(couple.id, codeKey), sealEnvelope(codeKey, join));
          relayClear(relay, offerBox(couple.id, codeKey)).catch(() => {});
          return { ok: true, result };
        }
        const { state: joined, codeKey, freshKey } = C.joinWithCode(stateRef.current, couple, Date.now());
        update(() => joined);
        const hello = envelopeFor({ kind: "hello", key: freshKey });
        const result = await deliver(helloBox(couple.id, codeKey), sealEnvelope(codeKey, hello));
        return { ok: true, result };
      },
      resendHello: async () => {
        const c = stateRef.current.couple;
        if (!c || c.role !== "joiner" || !c.previousKey) return null;
        const hello = c.proto === 2 && c.myPub ? envelopeFor({ kind: "join", pub: c.myPub }) : envelopeFor({ kind: "hello", key: c.key });
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
      dismissWelcome: () => update((s) => ({ ...s, welcomeDone: true })),
      syncNow,
    }),
    [state, ready, accountMode, locked, relay, syncStatus, update, envelopeFor, deliver, send, openLink, syncNow, archive, partnerPresence, shareSeen],
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
