"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "blockroom-activity-v2";
export const REQUIRED_SESSION_SECONDS = 30 * 60;

export type ActiveSession = {
  walletAddress: string;
  roomSlug: string;
  startedAt: string;
  lastCountedAt: string;
  elapsedSeconds: number;
  paused: boolean;
};

export type SessionRecord = {
  id: string;
  walletAddress: string;
  roomSlug: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  source: "local";
};

export type BadgeClaim = {
  id: string;
  walletAddress: string;
  level: 1 | 2;
  claimedAt: string;
  signature: string;
  source: "signed-local-demo";
};

type ActivityState = {
  activeSessions: Record<string, ActiveSession>;
  records: SessionRecord[];
  badgeClaims: BadgeClaim[];
};

type SessionContextValue = ActivityState & {
  hydrated: boolean;
  getActiveSession: (walletAddress?: string) => ActiveSession | null;
  getRecords: (walletAddress?: string) => SessionRecord[];
  getBadgeClaims: (walletAddress?: string) => BadgeClaim[];
  startSession: (roomSlug: string, walletAddress: string) => void;
  pauseSession: (walletAddress: string) => void;
  resumeSession: (walletAddress: string) => void;
  tickSession: (roomSlug: string, walletAddress: string) => void;
  cancelSession: (walletAddress: string) => void;
  completeSession: (walletAddress: string) => SessionRecord | null;
  saveBadgeClaim: (claim: BadgeClaim) => void;
};

const EMPTY_STATE: ActivityState = {
  activeSessions: {},
  records: [],
  badgeClaims: [],
};

const SessionContext = createContext<SessionContextValue | null>(null);

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

function pauseAllSessions(state: ActivityState, now = new Date()): ActivityState {
  const activeSessions = Object.fromEntries(
    Object.entries(state.activeSessions).map(([address, session]) => {
      if (session.paused) return [address, session];
      const additionalSeconds = Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(session.lastCountedAt).getTime()) / 1000,
        ),
      );
      return [
        address,
        {
          ...session,
          elapsedSeconds: session.elapsedSeconds + additionalSeconds,
          lastCountedAt: now.toISOString(),
          paused: true,
        },
      ];
    }),
  );
  return { ...state, activeSessions };
}

function readState(raw: string | null): ActivityState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<ActivityState>;
    const activeSessions =
      parsed.activeSessions && typeof parsed.activeSessions === "object"
        ? Object.fromEntries(
            Object.entries(parsed.activeSessions).map(([address, session]) => [
              address,
              {
                ...session,
                lastCountedAt:
                  typeof session.lastCountedAt === "string"
                    ? session.lastCountedAt
                    : new Date().toISOString(),
              },
            ]),
          )
        : {};
    return {
      activeSessions,
      records: Array.isArray(parsed.records)
        ? parsed.records.filter((record) => Boolean(record?.walletAddress))
        : [],
      badgeClaims: Array.isArray(parsed.badgeClaims)
        ? parsed.badgeClaims.filter((claim) => Boolean(claim?.walletAddress))
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActivityState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setState(readState(window.localStorage.getItem(STORAGE_KEY)));
      setHydrated(true);
    });

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setState(readState(event.newValue));
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    const handlePageHide = () => {
      const pausedState = pauseAllSessions(state);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pausedState));
      setState(pausedState);
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [hydrated, state]);

  const getActiveSession = useCallback(
    (walletAddress?: string) =>
      walletAddress
        ? state.activeSessions[normalizeAddress(walletAddress)] ?? null
        : null,
    [state.activeSessions],
  );

  const getRecords = useCallback(
    (walletAddress?: string) => {
      if (!walletAddress) return [];
      const normalized = normalizeAddress(walletAddress);
      return state.records.filter(
        (record) => normalizeAddress(record.walletAddress) === normalized,
      );
    },
    [state.records],
  );

  const getBadgeClaims = useCallback(
    (walletAddress?: string) => {
      if (!walletAddress) return [];
      const normalized = normalizeAddress(walletAddress);
      return state.badgeClaims.filter(
        (claim) => normalizeAddress(claim.walletAddress) === normalized,
      );
    },
    [state.badgeClaims],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      hydrated,
      getActiveSession,
      getRecords,
      getBadgeClaims,
      startSession(roomSlug, walletAddress) {
        const normalized = normalizeAddress(walletAddress);
        const now = new Date().toISOString();
        setState((current) => ({
          ...current,
          activeSessions: {
            ...current.activeSessions,
            [normalized]: {
              walletAddress: normalized,
              roomSlug,
              startedAt: now,
              lastCountedAt: now,
              elapsedSeconds: 0,
              paused: false,
            },
          },
        }));
      },
      pauseSession(walletAddress) {
        const normalized = normalizeAddress(walletAddress);
        setState((current) => {
          const session = current.activeSessions[normalized];
          if (!session || session.paused) return current;
          const now = new Date();
          const additionalSeconds = Math.max(
            0,
            Math.floor(
              (now.getTime() - new Date(session.lastCountedAt).getTime()) / 1000,
            ),
          );
          return {
            ...current,
            activeSessions: {
              ...current.activeSessions,
              [normalized]: {
                ...session,
                elapsedSeconds: session.elapsedSeconds + additionalSeconds,
                lastCountedAt: now.toISOString(),
                paused: true,
              },
            },
          };
        });
      },
      resumeSession(walletAddress) {
        const normalized = normalizeAddress(walletAddress);
        setState((current) => {
          const session = current.activeSessions[normalized];
          if (!session || !session.paused) return current;
          return {
            ...current,
            activeSessions: {
              ...current.activeSessions,
              [normalized]: {
                ...session,
                lastCountedAt: new Date().toISOString(),
                paused: false,
              },
            },
          };
        });
      },
      tickSession(roomSlug, walletAddress) {
        const normalized = normalizeAddress(walletAddress);
        setState((current) => {
          const session = current.activeSessions[normalized];
          if (!session || session.roomSlug !== roomSlug || session.paused) {
            return current;
          }
          const now = new Date();
          const additionalSeconds = Math.max(
            0,
            Math.floor(
              (now.getTime() - new Date(session.lastCountedAt).getTime()) / 1000,
            ),
          );
          if (additionalSeconds === 0) return current;
          return {
            ...current,
            activeSessions: {
              ...current.activeSessions,
              [normalized]: {
                ...session,
                elapsedSeconds: session.elapsedSeconds + additionalSeconds,
                lastCountedAt: now.toISOString(),
              },
            },
          };
        });
      },
      cancelSession(walletAddress) {
        const normalized = normalizeAddress(walletAddress);
        setState((current) => {
          const activeSessions = { ...current.activeSessions };
          delete activeSessions[normalized];
          return { ...current, activeSessions };
        });
      },
      completeSession(walletAddress) {
        const normalized = normalizeAddress(walletAddress);
        const session = state.activeSessions[normalized];
        if (!session || session.elapsedSeconds < REQUIRED_SESSION_SECONDS) {
          return null;
        }

        const record: SessionRecord = {
          id: crypto.randomUUID(),
          walletAddress: normalized,
          roomSlug: session.roomSlug,
          startedAt: session.startedAt,
          completedAt: new Date().toISOString(),
          durationSeconds: session.elapsedSeconds,
          source: "local",
        };
        setState((current) => {
          const activeSessions = { ...current.activeSessions };
          delete activeSessions[normalized];
          return {
            ...current,
            activeSessions,
            records: [record, ...current.records],
          };
        });
        return record;
      },
      saveBadgeClaim(claim) {
        setState((current) => {
          const duplicate = current.badgeClaims.some(
            (item) =>
              normalizeAddress(item.walletAddress) ===
                normalizeAddress(claim.walletAddress) &&
              item.level === claim.level,
          );
          return duplicate
            ? current
            : { ...current, badgeClaims: [claim, ...current.badgeClaims] };
        });
      },
    }),
    [getActiveSession, getBadgeClaims, getRecords, hydrated, state],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
