"use client";

import { useState } from "react";
import {
  CheckCircle,
  LockKey,
  SealCheck,
  Sparkle,
} from "@phosphor-icons/react";
import type { Address } from "viem";
import {
  FIRST_SESSION_BADGE_ID,
  FOCUS_24_HOURS_BADGE_ID,
  transactionExplorerUrl,
} from "@/contracts/blockroom";
import { useBadgeClaim, useBadgeContractState } from "@/hooks/use-blockroom-contract";
import { AmbientModule } from "./ambient-module";

type BadgeSectionProps = {
  address?: Address;
  completionCount: number;
  totalDurationSeconds: number;
};

const badges = [
  {
    id: FIRST_SESSION_BADGE_ID,
    level: 1,
    name: "First Session",
    description: "Complete one confirmed eligible on-chain session.",
  },
  {
    id: FOCUS_24_HOURS_BADGE_ID,
    level: 2,
    name: "24 Hour Focus",
    description: "Accumulate 86,400 seconds of confirmed on-chain focus time.",
  },
] as const;

export function BadgeSection({ address, completionCount, totalDurationSeconds }: BadgeSectionProps) {
  const badgeState = useBadgeContractState(address);
  const claim = useBadgeClaim();
  const [pendingBadgeId, setPendingBadgeId] = useState<1n | 2n | null>(null);

  async function claimBadge(badgeId: 1n | 2n) {
    setPendingBadgeId(badgeId);
    await claim.claim(badgeId);
    setPendingBadgeId(null);
  }

  return (
    <section className="badge-section">
      <div className="dashboard-section-heading">
        <div><span>Achievements</span><h2>Soulbound badges</h2></div>
        <SealCheck size={29} weight="light" />
      </div>
      <p className="badge-disclosure">
        Eligibility and ownership come from the BlockRoom contract. Claiming requires an explicit Monad Testnet transaction.
      </p>
      <div className="badge-grid">
        {badges.map((badge) => {
          const eligible = badge.id === FIRST_SESSION_BADGE_ID
            ? Boolean(badgeState.data?.firstEligible)
            : Boolean(badgeState.data?.focusEligible);
          const claimed = badge.id === FIRST_SESSION_BADGE_ID
            ? Boolean(badgeState.data?.firstClaimed)
            : Boolean(badgeState.data?.focusClaimed);
          const pending = pendingBadgeId === badge.id && (claim.status === "awaiting-wallet" || claim.status === "submitting");
          const lockedLabel = badge.id === FIRST_SESSION_BADGE_ID
            ? `${completionCount}/1 confirmed`
            : `${Math.min(totalDurationSeconds, 86_400).toLocaleString()}/86,400 sec`;
          return (
            <article className={claimed ? "badge-card signed" : eligible ? "badge-card eligible" : "badge-card locked"} key={badge.id.toString()}>
              <div className="badge-emblem" aria-hidden="true">
                <AmbientModule variant={claimed ? "signature" : eligible ? "proof" : "identity"} size="mini" />
                <span>0{badge.level}</span>
              </div>
              <div className="badge-copy"><span>Level {badge.level}</span><h3>{badge.name}</h3><p>{badge.description}</p></div>
              {claimed ? (
                <div className="badge-signed-state"><CheckCircle size={18} /> Claimed on-chain</div>
              ) : (
                <button type="button" disabled={!address || !claim.configured || !eligible || pending || badgeState.isLoading} onClick={() => void claimBadge(badge.id)}>
                  {eligible ? <Sparkle size={18} /> : <LockKey size={17} />}
                  {pending ? (claim.status === "submitting" ? "Confirming transaction" : "Awaiting wallet") : eligible ? "Claim badge" : lockedLabel}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {!claim.configured && <div className="badge-error" role="status">Contract not configured. No NFT claim is available yet.</div>}
      {claim.error && <div className="badge-error" role="alert">{claim.error}</div>}
      {claim.hash && transactionExplorerUrl(claim.hash) && (
        <a className="transaction-link" href={transactionExplorerUrl(claim.hash)} target="_blank" rel="noreferrer">View badge transaction</a>
      )}
    </section>
  );
}
