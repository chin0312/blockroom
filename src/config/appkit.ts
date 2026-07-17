import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { appKitNetworks, appKitRpcUrls } from "@/config/chains";

const configuredProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

export const isReownConfigured = Boolean(configuredProjectId);
export const projectId = configuredProjectId ?? "";
export const networks = appKitNetworks;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  customRpcUrls: appKitRpcUrls,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
