"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
} from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { getRoom } from "@/lib/rooms";
import { BadgeSection } from "./BadgeSection";
import { ContributionGraph } from "./ContributionGraph";
import { CrystalHardware } from "./crystal-hardware";
import { useSession } from "./session-provider";

function formatFocus(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
}

function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentStreak(completedAt: string[]) {
  if (!completedAt.length) return 0;
  const days = new Set(completedAt.map(localDateKey));
  const cursor = new Date();
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardClient() {
  const { address, chain, isConnected } = useAccount();
  const {
    hydrated,
    getRecords,
    getBadgeClaims,
    saveBadgeClaim,
  } = useSession();
  const records = getRecords(address);
  const claims = getBadgeClaims(address);
  const totalSeconds = records.reduce((sum, record) => sum + record.durationSeconds, 0);
  const streak = currentStreak(records.map((record) => record.completedAt));

  if (!hydrated) return <div className="dashboard-loading" aria-label="Loading local wallet activity" />;

  return (
    <div className="dashboard-product-grid">
      <section className="dashboard-identity-panel">
        <div className="identity-protocol" aria-hidden="true"><CrystalHardware variant="identity" size="mini" /></div>
        <div><span>Wallet identity</span><h2>{isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</h2><p>{isConnected ? chain?.name ?? "Network unavailable" : "Connect a wallet to load its local activity."}</p></div>
      </section>

      <div className="dashboard-stats">
        <article><CrystalHardware variant="time" size="nano" /><span>Total Focus Time</span><strong>{isConnected ? formatFocus(totalSeconds) : "Connect wallet"}</strong></article>
        <article><CrystalHardware variant="proof" size="nano" /><span>Current Streak</span><strong>{isConnected ? `${streak} ${streak === 1 ? "day" : "days"}` : "Connect wallet"}</strong></article>
        <article><CrystalHardware variant="signature" size="nano" /><span>Total Badges Earned</span><strong>{isConnected ? claims.length : "Connect wallet"}</strong></article>
      </div>

      <ContributionGraph records={records} />

      <section className="activity-panel">
        <div className="dashboard-section-heading"><div><span>Local activity</span><h2>Completed sessions</h2></div><strong>{records.length}</strong></div>
        {records.length ? (
          <div className="activity-list">
            {records.slice(0, 8).map((record) => {
              const room = getRoom(record.roomSlug);
              return <article key={record.id}><span className="activity-signal" /><div><h3>{room?.name ?? "Room"}</h3><p>{formatDate(record.completedAt)}</p></div><strong>{formatFocus(record.durationSeconds)}</strong></article>;
            })}
          </div>
        ) : (
          <div className="activity-empty"><Clock size={30} /><h3>No completed sessions</h3><p>A record appears only after 30 minutes of real joined-room time.</p><Link href="/rooms">Browse rooms <ArrowRight size={17} /></Link></div>
        )}
      </section>

      <BadgeSection
        address={address}
        chainId={chain?.id}
        networkName={chain?.name}
        completionCount={records.length}
        claims={claims}
        onClaim={saveBadgeClaim}
      />
    </div>
  );
}
