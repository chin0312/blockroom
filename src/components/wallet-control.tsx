"use client";

import { useEffect, useRef, useState } from "react";
import { useAppKit, useAppKitState } from "@reown/appkit/react";
import { Check, Copy, SignOut } from "@phosphor-icons/react";
import { useAccount, useDisconnect } from "wagmi";
import { isReownConfigured } from "@/config/appkit";
import {
  avatarVariants,
  getAvatarVariant,
  setAvatarVariant,
  type AvatarVariant,
} from "@/lib/profile";

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
  const { disconnect } = useDisconnect();
  const shellRef = useRef<HTMLDivElement>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [avatar, setAvatar] = useState<AvatarVariant>("violet");
  const [copied, setCopied] = useState(false);
  const ready = initialized && !loading;

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setAvatar(getAvatarVariant(address));
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    if (!identityOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setIdentityOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIdentityOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [identityOpen]);

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

  return (
    <div ref={shellRef} className={`wallet-identity-shell ${placement}`}>
      <div className="wallet-status" aria-label="Connected wallet and network">
        {placement === "nav" && (
          <button
            type="button"
            className="network-chip"
            onClick={() => open({ view: "Networks" })}
            aria-label={`Connected network: ${chain.name}. Change network`}
          >
            <span className="status-dot" aria-hidden="true" />
            <span>{chain.name}</span>
          </button>
        )}
        <button
          type="button"
          className={placement === "hero" ? "button button-secondary wallet-connect-hero" : "address-chip"}
          onClick={() => setIdentityOpen((current) => !current)}
          aria-expanded={identityOpen}
          aria-haspopup="dialog"
          aria-label={`BlockRoom identity: ${displayAddress} using ${connector?.name ?? "wallet"}`}
        >
          <span className={`wallet-avatar avatar-${avatar}`} aria-hidden="true" />
          <span>{displayAddress}</span>
        </button>
      </div>
      {identityOpen && (
        <section className="identity-popover" role="dialog" aria-label="BlockRoom identity settings">
          <header>
            <span className={`identity-avatar avatar-${avatar}`} aria-hidden="true" />
            <div><strong>BlockRoom identity</strong><span>{displayAddress}</span></div>
          </header>
          <dl>
            <div><dt>Wallet</dt><dd>{connector?.name ?? "Connected wallet"}</dd></div>
            <div><dt>Network</dt><dd>{chain.name}</dd></div>
          </dl>
          <fieldset>
            <legend>Platform avatar</legend>
            <div className="avatar-options">
              {avatarVariants.map((variant) => (
                <button
                  type="button"
                  key={variant}
                  className={avatar === variant ? "selected" : ""}
                  onClick={() => {
                    setAvatar(variant);
                    setAvatarVariant(address, variant);
                  }}
                  aria-label={`Use ${variant} avatar`}
                  aria-pressed={avatar === variant}
                >
                  <span className={`identity-avatar avatar-${variant}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="identity-actions">
            <button type="button" onClick={async () => {
              await navigator.clipboard.writeText(address);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}>
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Copied" : "Copy address"}
            </button>
            <button type="button" className="disconnect" onClick={() => disconnect()}><SignOut size={17} /> Disconnect</button>
          </div>
          <p>No balances, assets, or payment actions are loaded here.</p>
        </section>
      )}
    </div>
  );
}
