"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Address, Hex } from "viem";
import { BLOCKROOM_MIN_SESSION_SECONDS } from "@/contracts/blockroom";
import {
  advanceSession,
  createSessionDraft,
  finalizeSessionDraft,
  isActiveSession,
  type OnchainSessionDraft,
  type OnchainSessionStatus,
} from "@/lib/session-store";

const LEGACY_STORAGE_KEY = "blockroom-activity-v2";
const SESSION_STORAGE_PREFIX = "blockroom:onchain-session-v1:";
const SESSION_UPDATED_EVENT = "blockroom:onchain-session-updated";
const STALE_ACTIVE_SECONDS = 15;

export const REQUIRED_SESSION_SECONDS = BLOCKROOM_MIN_SESSION_SECONDS;

export type LegacySessionRecord = {
  id: string;
  walletAddress: string;
  roomSlug: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  source: "local";
};

export type LegacyBadgeClaim = {
  id: string;
  walletAddress: string;
  level: 1 | 2;
  claimedAt: string;
  signature: string;
  source: "signed-local-demo";
};

type SessionContextValue = {
  hydrated: boolean;
  sessions: OnchainSessionDraft[];
  legacyRecords: LegacySessionRecord[];
  legacyBadgeClaims: LegacyBadgeClaim[];
  getActiveSession: (walletAddress?: string) => OnchainSessionDraft | null;
  getPendingSessions: (walletAddress?: string) => OnchainSessionDraft[];
  getLegacyRecords: (walletAddress?: string) => LegacySessionRecord[];
  startSession: (roomSlug: string, walletAddress: Address) => OnchainSessionDraft;
  tickSession: (sessionId: Hex) => void;
  finalizeSession: (sessionId: Hex) => OnchainSessionDraft | null;
  finalizeWalletSession: (walletAddress: string) => OnchainSessionDraft | null;
  markSession: (
    sessionId: Hex,
    updates: Partial<Pick<OnchainSessionDraft, "status" | "txHash" | "error" | "confirmedAt">>,
  ) => OnchainSessionDraft | null;
};

type LegacyActivityState = {
  records?: LegacySessionRecord[];
  badgeClaims?: LegacyBadgeClaim[];
};

const SessionContext = createContext<SessionContextValue | null>(null);

function sessionKey(sessionId: Hex) {
  return `${SESSION_STORAGE_PREFIX}${sessionId}`;
}

function parseSession(raw: string | null): OnchainSessionDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OnchainSessionDraft;
    return parsed.sessionId && parsed.walletAddress && parsed.roomSlug ? parsed : null;
  } catch {
    return null;
  }
}

function readSessions(): OnchainSessionDraft[] {
  const sessions: OnchainSessionDraft[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(SESSION_STORAGE_PREFIX)) continue;
    const session = parseSession(window.localStorage.getItem(key));
    if (session) sessions.push(session);
  }
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}

function readLegacyState(): Required<LegacyActivityState> {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? "{}",
    ) as LegacyActivityState;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      badgeClaims: Array.isArray(parsed.badgeClaims) ? parsed.badgeClaims : [],
    };
  } catch {
    return { records: [], badgeClaims: [] };
  }
}

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<OnchainSessionDraft[]>([]);
  const [legacyRecords, setLegacyRecords] = useState<LegacySessionRecord[]>([]);
  const [legacyBadgeClaims, setLegacyBadgeClaims] = useState<LegacyBadgeClaim[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const runtimeIdRef = useRef(crypto.randomUUID());
  const sessionsRef = useRef<OnchainSessionDraft[]>([]);

  const replaceInState = useCallback((session: OnchainSessionDraft | null, id: Hex) => {
    setSessions((current) => {
      const next = session
        ? [session, ...current.filter((item) => item.sessionId !== id)]
        : current.filter((item) => item.sessionId !== id);
      next.sort((a, b) => b.startedAt - a.startedAt);
      sessionsRef.current = next;
      return next;
    });
  }, []);

  const persistSession = useCallback((session: OnchainSessionDraft) => {
    window.localStorage.setItem(sessionKey(session.sessionId), JSON.stringify(session));
    replaceInState(session, session.sessionId);
    window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT));
  }, [replaceInState]);

  const removeSession = useCallback((sessionId: Hex) => {
    window.localStorage.removeItem(sessionKey(sessionId));
    replaceInState(null, sessionId);
    window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT));
  }, [replaceInState]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const recovered = readSessions().flatMap((session) => {
        if (
          isActiveSession(session) &&
          nowSeconds - session.lastObservedAt > STALE_ACTIVE_SECONDS
        ) {
          const finalized = finalizeSessionDraft(session, session.lastObservedAt);
          if (finalized) {
            window.localStorage.setItem(sessionKey(finalized.sessionId), JSON.stringify(finalized));
            return [finalized];
          }
          window.localStorage.removeItem(sessionKey(session.sessionId));
          return [];
        }
        return [session];
      });
      const legacy = readLegacyState();
      sessionsRef.current = recovered;
      setSessions(recovered);
      setLegacyRecords(legacy.records);
      setLegacyBadgeClaims(legacy.badgeClaims);
      setHydrated(true);
    });

    const refresh = () => {
      const next = readSessions();
      sessionsRef.current = next;
      setSessions(next);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith(SESSION_STORAGE_PREFIX)) refresh();
      if (event.key === LEGACY_STORAGE_KEY) {
        const nextLegacy = readLegacyState();
        setLegacyRecords(nextLegacy.records);
        setLegacyBadgeClaims(nextLegacy.badgeClaims);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(SESSION_UPDATED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SESSION_UPDATED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const handlePageHide = () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      sessionsRef.current
        .filter(
          (session) =>
            session.ownerId === runtimeIdRef.current && isActiveSession(session),
        )
        .forEach((session) => {
          const finalized = finalizeSessionDraft(session, nowSeconds);
          if (finalized) {
            window.localStorage.setItem(sessionKey(finalized.sessionId), JSON.stringify(finalized));
          } else {
            window.localStorage.removeItem(sessionKey(session.sessionId));
          }
        });
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [hydrated]);

  const getActiveSession = useCallback(
    (walletAddress?: string) => {
      if (!walletAddress) return null;
      const normalized = normalizeAddress(walletAddress);
      return sessions.find(
        (session) =>
          normalizeAddress(session.walletAddress) === normalized &&
          session.ownerId === runtimeIdRef.current &&
          isActiveSession(session),
      ) ?? null;
    },
    [sessions],
  );

  const getPendingSessions = useCallback(
    (walletAddress?: string) => {
      if (!walletAddress) return [];
      const normalized = normalizeAddress(walletAddress);
      return sessions.filter(
        (session) =>
          normalizeAddress(session.walletAddress) === normalized &&
          !isActiveSession(session) &&
          session.status !== "confirmed",
      );
    },
    [sessions],
  );

  const getLegacyRecords = useCallback(
    (walletAddress?: string) => {
      if (!walletAddress) return [];
      const normalized = normalizeAddress(walletAddress);
      return legacyRecords.filter(
        (record) => normalizeAddress(record.walletAddress) === normalized,
      );
    },
    [legacyRecords],
  );

  const updateStoredSession = useCallback((
    sessionId: Hex,
    transform: (current: OnchainSessionDraft) => OnchainSessionDraft | null,
  ) => {
    const current = parseSession(window.localStorage.getItem(sessionKey(sessionId)));
    if (!current) return null;
    const next = transform(current);
    if (next) persistSession(next);
    else removeSession(sessionId);
    return next;
  }, [persistSession, removeSession]);

  const value = useMemo<SessionContextValue>(() => ({
    hydrated,
    sessions,
    legacyRecords,
    legacyBadgeClaims,
    getActiveSession,
    getPendingSessions,
    getLegacyRecords,
    startSession(roomSlug, walletAddress) {
      const session = createSessionDraft({
        walletAddress,
        roomSlug,
        ownerId: runtimeIdRef.current,
      });
      persistSession(session);
      return session;
    },
    tickSession(sessionId) {
      updateStoredSession(sessionId, (current) => advanceSession(current));
    },
    finalizeSession(sessionId) {
      return updateStoredSession(sessionId, (current) => finalizeSessionDraft(current));
    },
    finalizeWalletSession(walletAddress) {
      const normalized = normalizeAddress(walletAddress);
      const active = sessionsRef.current.find(
        (session) =>
          normalizeAddress(session.walletAddress) === normalized &&
          session.ownerId === runtimeIdRef.current &&
          isActiveSession(session),
      );
      return active
        ? updateStoredSession(active.sessionId, (current) => finalizeSessionDraft(current))
        : null;
    },
    markSession(sessionId, updates) {
      return updateStoredSession(sessionId, (current) => ({
        ...current,
        ...updates,
      }));
    },
  }), [
    getActiveSession,
    getLegacyRecords,
    getPendingSessions,
    hydrated,
    legacyBadgeClaims,
    legacyRecords,
    persistSession,
    sessions,
    updateStoredSession,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}

export type { OnchainSessionDraft, OnchainSessionStatus };
