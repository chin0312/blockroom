"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { getRoom } from "@/lib/rooms";
import { Icon } from "./icons";
import { useSession } from "./session-provider";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardClient() {
  const { address, chain, isConnected } = useAccount();
  const { activeSession, records, hydrated, cancelSession } = useSession();
  const activeRoom = activeSession ? getRoom(activeSession.roomSlug) : undefined;
  const totalMinutes = Math.floor(records.reduce((sum, record) => sum + record.durationSeconds, 0) / 60);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-card identity-dashboard-card">
        <span className="card-label">Wallet identity</span>
        <div className="identity-orb"><Icon name="wallet" size={30} /></div>
        <h2>{isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected"}</h2>
        <p>{isConnected ? chain?.name ?? "Network unavailable" : "Connect MetaMask from the navigation to establish identity."}</p>
      </section>

      <section className="dashboard-card stat-dashboard-card">
        <span className="card-label">Local demo records</span>
        <strong>{hydrated ? records.length : "—"}</strong>
        <p>Eligible sessions completed in this browser</p>
      </section>

      <section className="dashboard-card stat-dashboard-card accent-surface">
        <span className="card-label">Recorded focus</span>
        <strong>{hydrated ? totalMinutes : "—"}<small> min</small></strong>
        <p>Actual qualifying local session time</p>
      </section>

      <section className="dashboard-card active-session-card">
        <div className="card-heading-row">
          <div>
            <span className="card-label">Current session</span>
            <h2>{activeRoom?.name ?? "No active session"}</h2>
          </div>
          <Icon name="timer" size={28} />
        </div>
        {activeSession && activeRoom ? (
          <>
            <div className="active-session-metric">
              <strong>{formatDuration(activeSession.elapsedSeconds)}</strong>
              <span>{activeSession.paused ? "Manually paused" : "Paused outside its room"}</span>
            </div>
            <div className="dashboard-actions">
              <Link className="button button-primary" href={`/rooms/${activeRoom.slug}`}>Return to room</Link>
              <button className="button button-quiet" type="button" onClick={cancelSession}>Cancel</button>
            </div>
          </>
        ) : (
          <div className="dashboard-empty-inline">
            <p>Enter an empty room and start a timer when you are ready to focus.</p>
            <Link className="text-link" href="/rooms">Browse rooms <Icon name="arrow" size={17} /></Link>
          </div>
        )}
      </section>

      <section className="dashboard-card records-card">
        <div className="card-heading-row">
          <div>
            <span className="card-label">Session history</span>
            <h2>Local records</h2>
          </div>
          <span className="local-badge">Not on-chain</span>
        </div>
        {records.length ? (
          <div className="record-list">
            {records.map((record) => {
              const room = getRoom(record.roomSlug);
              return (
                <article className="record-row" key={record.id}>
                  <span className="record-icon"><Icon name="check" size={18} /></span>
                  <div><h3>{room?.name ?? "Room"}</h3><p>{formatDate(record.completedAt)}</p></div>
                  <strong>{formatDuration(record.durationSeconds)}</strong>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="records-empty">
            <span className="empty-symbol"><Icon name="empty" size={30} /></span>
            <h3>No completed sessions yet</h3>
            <p>A record appears only after 30 minutes of real visible-room time.</p>
          </div>
        )}
      </section>

      <section className="dashboard-card onchain-card">
        <span className="card-label">On-chain reputation</span>
        <div className="chain-diagram" aria-hidden="true">
          <span><Icon name="check" size={20} /></span><i /><span><Icon name="cube" size={24} /></span><i /><span><Icon name="shield" size={20} /></span>
        </div>
        <h2>Contract connection comes in Phase 3.</h2>
        <p>
          Local records above prove the interaction flow only. They are not
          reputation. A real Monad transaction and contract read will replace
          this empty state after deployment.
        </p>
        <button className="button button-primary" type="button" disabled>On-chain check-in unavailable</button>
      </section>
    </div>
  );
}
