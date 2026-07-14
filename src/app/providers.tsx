"use client";

import { useState, type ReactNode } from "react";
import {
  connectorsForWallets,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { SessionProvider } from "@/components/session-provider";

const metaMaskExtensionWallet = () => ({
  ...injectedWallet(),
  id: "metaMaskExtension",
  name: "MetaMask extension",
  downloadUrls: {
    browserExtension: "https://metamask.io/download/",
  },
});

const connectors = connectorsForWallets(
  [
    {
      groupName: "Browser wallet",
      wallets: [metaMaskExtensionWallet],
    },
  ],
  {
    appName: "BlockRoom",
    appDescription: "A Web3 co-learning space on Monad Testnet",
    // connectorsForWallets requires this field, but the injected browser
    // connector never reads it. No WalletConnect credential is fabricated.
    projectId: "",
  },
);

const config = createConfig({
  chains: [monadTestnet],
  connectors,
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={monadTestnet}
          modalSize="compact"
          theme={lightTheme({
            accentColor: "#3D52A0",
            accentColorForeground: "#FFFFFF",
            borderRadius: "large",
            overlayBlur: "small",
          })}
        >
          <SessionProvider>{children}</SessionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
