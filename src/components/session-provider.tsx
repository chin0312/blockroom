"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "blockroom-session-state-v1";
export const REQUIRED_SESSION_SECONDS = 30 * 60;

export type ActiveSession = {
  roomSlug: string;
  startedAt: string;
  elapsedSeconds: number;
  paused: boolean;
};

export type SessionRecord = {
  id: string;
  roomSlug: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  source: "local";
};

type StoredState = {
  activeSession: ActiveSession | null;
  records: SessionRecord[];
};

type SessionContextValue = StoredState & {
  hydrated: boolean;
  startSession: (roomSlug: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tickSession: (roomSlug: string) => void;
  cancelSession: () => void;
  completeSession: () => boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function isStoredState(value: unknown): value is StoredState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredState>;
  return Array.isArray(candidate.records) &&
    (candidate.activeSession === null || typeof candidate.activeSession === "object");
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isStoredState(parsed)) {
            setActiveSession(parsed.activeSession);
            setRecords(parsed.records);
          }
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeSession, records }),
    );
  }, [activeSession, hydrated, records]);

  const value = useMemo<SessionContextValue>(
    () => ({
      activeSession,
      records,
      hydrated,
      startSession(roomSlug) {
        setActiveSession({
          roomSlug,
          startedAt: new Date().toISOString(),
          elapsedSeconds: 0,
          paused: false,
        });
      },
      pauseSession() {
        setActiveSession((current) =>
          current ? { ...current, paused: true } : current,
        );
      },
      resumeSession() {
        setActiveSession((current) =>
          current ? { ...current, paused: false } : current,
        );
      },
      tickSession(roomSlug) {
        setActiveSession((current) => {
          if (!current || current.roomSlug !== roomSlug || current.paused) {
            return current;
          }
          return { ...current, elapsedSeconds: current.elapsedSeconds + 1 };
        });
      },
      cancelSession() {
        setActiveSession(null);
      },
      completeSession() {
        if (!activeSession || activeSession.elapsedSeconds < REQUIRED_SESSION_SECONDS) {
          return false;
        }

        const record: SessionRecord = {
          id: crypto.randomUUID(),
          roomSlug: activeSession.roomSlug,
          startedAt: activeSession.startedAt,
          completedAt: new Date().toISOString(),
          durationSeconds: activeSession.elapsedSeconds,
          source: "local",
        };
        setRecords((current) => [record, ...current]);
        setActiveSession(null);
        return true;
      },
    }),
    [activeSession, hydrated, records],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
