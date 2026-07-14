"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Room } from "@/lib/rooms";
import { Icon } from "./icons";
import { REQUIRED_SESSION_SECONDS, useSession } from "./session-provider";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RoomSessionPanel({ room }: { room: Room }) {
  const router = useRouter();
  const {
    activeSession,
    hydrated,
    startSession,
    pauseSession,
    resumeSession,
    tickSession,
    cancelSession,
    completeSession,
  } = useSession();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isCurrentRoom = activeSession?.roomSlug === room.slug;
  const elapsed = isCurrentRoom ? activeSession.elapsedSeconds : 0;
  const eligible = elapsed >= REQUIRED_SESSION_SECONDS;
  const progress = Math.min(100, (elapsed / REQUIRED_SESSION_SECONDS) * 100);

  useEffect(() => {
    if (!isCurrentRoom || activeSession.paused) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") tickSession(room.slug);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeSession?.paused, isCurrentRoom, room.slug, tickSession]);

  function handleComplete() {
    if (completeSession()) router.push("/dashboard");
  }

  if (!hydrated) {
    return <div className="session-loading" aria-live="polite">Loading local session state…</div>;
  }

  return (
    <div className="session-console">
      <div className="timer-column">
        <div className="timer-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <div className="timer-ring-inner">
            <span>Visible room time</span>
            <strong>{formatTimer(elapsed)}</strong>
            <small>/ 30:00</small>
          </div>
        </div>
        <div className="timer-status" aria-live="polite">
          <span className={isCurrentRoom && !activeSession.paused ? "live-dot active" : "live-dot"} />
          {!isCurrentRoom
            ? "Timer not started"
            : activeSession.paused
              ? "Session paused"
              : document.visibilityState === "visible"
                ? "Counting visible time"
                : "Paused while tab is hidden"}
        </div>
      </div>

      <div className="session-controls">
        <span className="section-label">30-minute eligibility gate</span>
        <h2>{isCurrentRoom ? "Your focus session is active" : "Start a solo focus session"}</h2>
        <p>
          This room is empty. Use it as a personal focus surface; only time spent
          here with this tab visible moves the timer forward.
        </p>

        {!isCurrentRoom && activeSession && (
          <div className="inline-notice">
            Another room has an active session. Return to it or cancel it from Dashboard.
            <Link href={`/rooms/${activeSession.roomSlug}`}>Return to active room</Link>
          </div>
        )}

        {!isCurrentRoom && !activeSession && (
          <button className="button button-primary" type="button" onClick={() => startSession(room.slug)}>
            <Icon name="play" size={18} /> Start 30-minute session
          </button>
        )}

        {isCurrentRoom && (
          <>
            <div className="control-row">
              <button
                className="button button-secondary"
                type="button"
                onClick={activeSession.paused ? resumeSession : pauseSession}
              >
                <Icon name={activeSession.paused ? "play" : "pause"} size={18} />
                {activeSession.paused ? "Resume" : "Pause"}
              </button>
              <button className="button button-quiet" type="button" onClick={() => setConfirmCancel(true)}>
                Cancel session
              </button>
            </div>
            {confirmCancel && (
              <div className="cancel-confirm" role="alert">
                <p>Cancel this session? Its accumulated time will be discarded.</p>
                <div>
                  <button className="button button-danger" type="button" onClick={cancelSession}>Discard time</button>
                  <button className="button button-quiet" type="button" onClick={() => setConfirmCancel(false)}>Keep session</button>
                </div>
              </div>
            )}
            <button
              className="button button-primary complete-button"
              type="button"
              disabled={!eligible}
              onClick={handleComplete}
            >
              <Icon name="check" size={18} /> Complete session
            </button>
            <p className="eligibility-note">
              {eligible
                ? "Eligible — completing creates a local demo record. No transaction is sent yet."
                : `${formatTimer(REQUIRED_SESSION_SECONDS - elapsed)} of visible time remaining.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
