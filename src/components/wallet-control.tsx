"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

type WalletControlProps = {
  placement?: "nav" | "hero";
};

export function WalletControl({ placement = "nav" }: WalletControlProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button
              type="button"
              className={`button button-primary wallet-connect wallet-connect-${placement}`}
              onClick={openConnectModal}
              disabled={!ready}
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              className="button button-warning"
              onClick={openChainModal}
            >
              Switch network
            </button>
          );
        }

        if (placement === "hero") {
          return (
            <button
              type="button"
              className="button button-secondary wallet-connect-hero"
              onClick={openAccountModal}
              aria-label={`Wallet connected: ${account.displayName}`}
            >
              {account.displayName}
            </button>
          );
        }

        return (
          <div className="wallet-status" aria-label="Connected wallet status">
            <button
              type="button"
              className="network-chip"
              onClick={openChainModal}
              aria-label={`Connected network: ${chain.name}. Change network`}
            >
              <span className="status-dot" aria-hidden="true" />
              <span>{chain.name}</span>
            </button>
            <button
              type="button"
              className="address-chip"
              onClick={openAccountModal}
              aria-label={`Connected wallet: ${account.displayName}. Open wallet menu`}
            >
              <span className="wallet-avatar" aria-hidden="true" />
              <span>{account.displayName}</span>
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
