"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  CloudArrowUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import type { Hex } from "viem";
import {
  getChainConfig,
  isSupportedChainId,
  transactionExplorerUrl,
} from "@/config/chains";
import { getRoom } from "@/lib/rooms";
import { splitSessionAcrossLocalDays, type ConfirmedSessionRecord } from "@/lib/session-store";
import { useConfirmedSessions, useBadgeContractState, useSessionSubmission } from "@/hooks/use-blockroom-contract";
import { BadgeSection } from "./BadgeSection";
import { ContributionGraph } from "./ContributionGraph";
import { AmbientModule } from "./ambient-module";
import { useSession } from "./session-provider";

function formatFocus(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
}

function currentStreak(records: ConfirmedSessionRecord[]) {
  if (!records.length) return 0;
  const days = new Set<string>();
  records.forEach((record) => {
    splitSessionAcrossLocalDays(record.startedAt, record.endedAt).forEach((_, key) => days.add(key));
  });
  const keyFor = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const cursor = new Date();
  if (!days.has(keyFor(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(keyFor(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatDate(unixSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(unixSeconds * 1000));
}

export function DashboardClient() {
  const { address, chain, isConnected } = useAccount();
  const chainId = chain?.id;
  const supportedChainId = isSupportedChainId(chainId) ? chainId : undefined;
  const chainConfig = getChainConfig(supportedChainId);
  const { hydrated, getPendingSessions, getLegacyRecords } = useSession();
  const confirmedQuery = useConfirmedSessions(address, supportedChainId);
  const badgeQuery = useBadgeContractState(address, supportedChainId);
  const submission = useSessionSubmission();
  const [retryingId, setRetryingId] = useState<Hex | null>(null);
  const records = confirmedQuery.data ?? [];
  const pendingSessions = getPendingSessions(address, supportedChainId);
  const legacyRecords = getLegacyRecords(address);
  const totalSeconds = records.reduce((sum, record) => sum + record.durationSeconds, 0);
  const streak = currentStreak(records);
  const totalBadges = Number(Boolean(badgeQuery.data?.firstClaimed)) + Number(Boolean(badgeQuery.data?.focusClaimed));

  async function retrySession(sessionId: Hex) {
    const session = pendingSessions.find((item) => item.sessionId === sessionId);
    if (!session) return;
    setRetryingId(sessionId);
    await submission.submit(session);
    setRetryingId(null);
  }

  if (!hydrated) return <div className="dashboard-loading" aria-label="Loading wallet activity" />;

  const disconnectedLabel = !isConnected
    ? "Connect wallet"
    : !chainConfig
      ? "Unsupported network"
      : !chainConfig.contracts.sessions
        ? "Not deployed"
        : confirmedQuery.isLoading
          ? "Loading"
          : undefined;

  return (
    <div className="dashboard-product-grid">
      <section className="dashboard-identity-panel">
        <div className="identity-protocol" aria-hidden="true"><AmbientModule variant="identity" size="card" /></div>
        <div><span>Wallet identity</span><h2>{isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</h2><p>{isConnected ? chainConfig?.name ?? chain?.name ?? "Unsupported network" : "Connect a wallet to load its chain-specific activity."}</p></div>
      </section>

      <div className="dashboard-stats">
        <article><AmbientModule variant="time" size="nano" /><span>Total Focus Time</span><strong>{disconnectedLabel ?? formatFocus(totalSeconds)}</strong></article>
        <article><AmbientModule variant="proof" size="nano" /><span>Current Streak</span><strong>{disconnectedLabel ?? `${streak} ${streak === 1 ? "day" : "days"}`}</strong></article>
        <article><AmbientModule variant="signature" size="nano" /><span>Total Badges Earned</span><strong>{disconnectedLabel ?? totalBadges}</strong></article>
      </div>

      {isConnected && !chainConfig && (
        <div className="onchain-disclosure" role="status"><WarningCircle size={19} /> Switch to Monad Testnet, Base Sepolia, or Ethereum Sepolia to view BlockRoom activity.</div>
      )}
      {chainConfig && !chainConfig.contracts.sessions && (
        <div className="onchain-disclosure" role="status"><WarningCircle size={19} /> Session recording is not deployed on {chainConfig.name}. Rooms remain usable, but no data is presented as on-chain.</div>
      )}
      {confirmedQuery.error && (
        <div className="onchain-disclosure error" role="alert"><WarningCircle size={19} /> Confirmed records could not be loaded. Pending local records remain safe.</div>
      )}

      <ContributionGraph records={records} />

      <section className="pending-session-panel">
        <div className="dashboard-section-heading"><div><span>Awaiting confirmation</span><h2>Pending eligible sessions</h2></div><strong>{pendingSessions.length}</strong></div>
        <p className="badge-disclosure">Pending and failed sessions never affect confirmed totals, the contribution calendar, or NFT eligibility.</p>
        {pendingSessions.length ? (
          <div className="pending-session-list">
            {pendingSessions.map((session) => {
              const explorer = transactionExplorerUrl(session.chainId, session.txHash);
              const busy = retryingId === session.sessionId && (submission.status === "awaiting-wallet" || submission.status === "submitting");
              return (
                <article key={session.sessionId}>
                  <div><strong>{getRoom(session.roomSlug)?.name ?? session.roomSlug}</strong><p>{formatFocus(session.durationSeconds)} · {session.status.replaceAll("-", " ")}</p></div>
                  <div className="pending-session-actions">
                    {explorer && <a href={explorer} target="_blank" rel="noreferrer">Explorer</a>}
                    <button type="button" disabled={busy || !submission.isConfigured(session.chainId)} onClick={() => void retrySession(session.sessionId)}>
                      <CloudArrowUp size={16} /> {busy ? "Confirming" : session.status === "submitting" ? "Resume receipt" : "Retry"}
                    </button>
                  </div>
                  {session.error && <p className="pending-error">{session.error}</p>}
                </article>
              );
            })}
          </div>
        ) : <div className="pending-empty">No eligible sessions are waiting for wallet confirmation.</div>}
      </section>

      <section className="activity-panel">
        <div className="dashboard-section-heading"><div><span>Confirmed on-chain</span><h2>Completed sessions</h2></div><strong>{records.length}</strong></div>
        {records.length ? (
          <div className="activity-list">
            {records.slice(0, 8).map((record) => {
              const room = getRoom(record.roomSlug);
              return <article key={record.sessionId}><span className="activity-signal" /><div><h3>{room?.name ?? "Room"}</h3><p>{formatDate(record.endedAt)}</p></div><strong>{formatFocus(record.durationSeconds)}</strong></article>;
            })}
          </div>
        ) : (
          <div className="activity-empty"><Clock size={30} /><h3>No confirmed sessions</h3><p>An eligible session appears here only after its {chainConfig?.name ?? "selected network"} transaction succeeds.</p><Link href="/rooms">Browse rooms <ArrowRight size={17} /></Link></div>
        )}
      </section>

      <BadgeSection address={address} chainId={supportedChainId} completionCount={records.length} totalDurationSeconds={totalSeconds} />

      <div className="onchain-disclosure" role="note">
        <WarningCircle size={19} /> Dashboard history is scoped to the connected chain. Cross-chain aggregation is planned after Public Beta.
      </div>

      {legacyRecords.length > 0 && (
        <section className="legacy-panel">
          <div className="dashboard-section-heading"><div><span>Browser-local legacy</span><h2>Previous local records</h2></div><strong>{legacyRecords.length}</strong></div>
          <p>These records remain available for transparency, but they do not affect on-chain totals, calendar intensity, or NFT eligibility.</p>
        </section>
      )}
    </div>
  );
}
