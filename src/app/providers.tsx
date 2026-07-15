"use client";

import { useState, type ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  isReownConfigured,
  networks,
  projectId,
  wagmiAdapter,
  wagmiConfig,
} from "@/config/appkit";
import { SessionProvider } from "@/components/session-provider";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (isReownConfigured) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    defaultNetwork: networks[0],
    projectId,
    metadata: {
      name: "BlockRoom",
      description: "A real-time Web3 co-learning and co-working space",
      url: appUrl,
      icons: [`${appUrl}/favicon.ico`],
    },
    allWallets: "SHOW",
    themeMode: "light",
    themeVariables: {
      "--w3m-font-family": "Arial, Helvetica Neue, sans-serif",
      "--w3m-accent": "#111111",
      "--w3m-color-mix": "#7667f7",
      "--w3m-color-mix-strength": 14,
      "--w3m-border-radius-master": "2px",
      "--apkt-font-family": "Arial, Helvetica Neue, sans-serif",
      "--apkt-accent": "#111111",
      "--apkt-color-mix": "#7667f7",
      "--apkt-color-mix-strength": 14,
      "--apkt-border-radius-master": "2px",
      "--apkt-z-index": 300,
    },
    features: {
      analytics: false,
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
