import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  arbitrum,
  base,
  mainnet,
  monadTestnet,
  optimism,
  polygon,
  type AppKitNetwork,
} from "@reown/appkit/networks";

const configuredProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

export const isReownConfigured = Boolean(configuredProjectId);
export const projectId =
  configuredProjectId ?? "blockroom-reown-project-id-required";

export const networks = [
  monadTestnet,
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

