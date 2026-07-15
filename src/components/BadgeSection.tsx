"use client";

import { useState } from "react";
import {
  CheckCircle,
  LockKey,
  SealCheck,
  Signature,
} from "@phosphor-icons/react";
import { useSignMessage } from "wagmi";
import type { BadgeClaim } from "./session-provider";
import { AmbientModule } from "./ambient-module";

type BadgeSectionProps = {
  address?: string;
  chainId?: number;
  networkName?: string;
  completionCount: number;
  claims: BadgeClaim[];
  onClaim: (claim: BadgeClaim) => void;
};

const badges = [
  { level: 1 as const, required: 1, name: "First Proof", description: "Complete one eligible focus session." },
  { level: 2 as const, required: 5, name: "Focus Protocol", description: "Complete five eligible focus sessions." },
];

export function BadgeSection({
  address,
  chainId,
  networkName,
  completionCount,
  claims,
  onClaim,
}: BadgeSectionProps) {
  const { signMessageAsync } = useSignMessage();
  const [pendingLevel, setPendingLevel] = useState<1 | 2 | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function claimBadge(level: 1 | 2, name: string) {
    if (!address) return;
    setPendingLevel(level);
    setError(null);
    const claimedAt = new Date().toISOString();
    const message = [
      "BlockRoom signed demo badge",
      `Wallet: ${address.toLowerCase()}`,
      `Badge: ${name} (Level ${level})`,
      `Network context: ${networkName ?? "Unknown network"}${chainId ? ` (${chainId})` : ""}`,
      `Requested at: ${claimedAt}`,
      "This signature does not mint an NFT, send a transaction, or spend gas.",
    ].join("\n");

    try {
      const signature = await signMessageAsync({ message });
      onClaim({
        id: crypto.randomUUID(),
        walletAddress: address.toLowerCase(),
        level,
        claimedAt,
        signature,
        source: "signed-local-demo",
      });
    } catch (signError) {
      setError(
        signError instanceof Error && signError.message.toLowerCase().includes("reject")
          ? "Signature request was rejected. No badge was saved."
          : "The wallet could not sign this badge claim.",
      );
    } finally {
      setPendingLevel(null);
    }
  }

  return (
    <section className="badge-section">
      <div className="dashboard-section-heading">
        <div><span>Achievements</span><h2>Signed demo badges</h2></div>
        <SealCheck size={29} weight="light" />
      </div>
      <p className="badge-disclosure">A claim opens a real wallet signature request. The result stays in this browser and is not an NFT.</p>
      <div className="badge-grid">
        {badges.map((badge) => {
          const claim = claims.find((item) => item.level === badge.level);
          const eligible = completionCount >= badge.required;
          const pending = pendingLevel === badge.level;
          return (
            <article className={claim ? "badge-card signed" : eligible ? "badge-card eligible" : "badge-card locked"} key={badge.level}>
              <div className="badge-emblem" aria-hidden="true">
                <AmbientModule variant={claim ? "signature" : eligible ? "proof" : "identity"} size="mini" />
                <span>0{badge.level}</span>
              </div>
              <div className="badge-copy"><span>Level {badge.level}</span><h3>{badge.name}</h3><p>{badge.description}</p></div>
              {claim ? (
                <div className="badge-signed-state"><CheckCircle size={18} /> Signed demo badge</div>
              ) : (
                <button type="button" disabled={!address || !eligible || pending} onClick={() => claimBadge(badge.level, badge.name)}>
                  {eligible ? <Signature size={18} /> : <LockKey size={17} />}
                  {pending ? "Awaiting signature" : eligible ? "Sign Badge Claim" : `${completionCount}/${badge.required} sessions`}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {error && <div className="badge-error" role="alert">{error}</div>}
    </section>
  );
}
