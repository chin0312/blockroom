"use client";

import { useAppKit, useAppKitState } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { isReownConfigured } from "@/config/appkit";

type WalletControlProps = {
  placement?: "nav" | "hero";
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletControl({ placement = "nav" }: WalletControlProps) {
  if (!isReownConfigured) {
    return (
      <button
        type="button"
        className={`button button-primary wallet-connect wallet-connect-${placement}`}
        disabled
        title="Add NEXT_PUBLIC_REOWN_PROJECT_ID to enable wallet connections"
      >
        Wallet setup required
      </button>
    );
  }

  return <ConfiguredWalletControl placement={placement} />;
}

function ConfiguredWalletControl({ placement }: Required<WalletControlProps>) {
  const { open } = useAppKit();
  const { initialized, loading } = useAppKitState();
  const { address, chain, connector, isConnected } = useAccount();
  const ready = initialized && !loading;

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        className={`button button-primary wallet-connect wallet-connect-${placement}`}
        onClick={() => open({ view: "Connect", namespace: "eip155" })}
        disabled={!ready}
      >
        {loading ? "Loading wallets" : "Connect Wallet"}
      </button>
    );
  }

  if (!chain) {
    return (
      <button
        type="button"
        className="button button-warning"
        onClick={() => open({ view: "Networks" })}
      >
        Select network
      </button>
    );
  }

  const displayAddress = shortAddress(address);

  if (placement === "hero") {
    return (
      <button
        type="button"
        className="button button-secondary wallet-connect-hero"
        onClick={() => open({ view: "Account" })}
        aria-label={`Wallet connected: ${displayAddress} with ${connector?.name ?? "wallet"}`}
      >
        {displayAddress}
      </button>
    );
  }

  return (
    <div className="wallet-status" aria-label="Connected wallet and network">
      <button
        type="button"
        className="network-chip"
        onClick={() => open({ view: "Networks" })}
        aria-label={`Connected network: ${chain.name}. Change network`}
      >
        <span className="status-dot" aria-hidden="true" />
        <span>{chain.name}</span>
      </button>
      <button
        type="button"
        className="address-chip"
        onClick={() => open({ view: "Account" })}
        aria-label={`Connected wallet: ${displayAddress} using ${connector?.name ?? "wallet"}. Open account`}
      >
        <span className="wallet-avatar" aria-hidden="true" />
        <span>{displayAddress}</span>
      </button>
    </div>
  );
}
