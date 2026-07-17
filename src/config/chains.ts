import { isAddress, type Address, type Hex } from "viem";
import {
  baseSepolia,
  monadTestnet,
  sepolia,
  type AppKitNetwork,
} from "@reown/appkit/networks";

export const SUPPORTED_CHAIN_IDS = [
  monadTestnet.id,
  baseSepolia.id,
  sepolia.id,
] as const;

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export type BlockRoomChainConfig = {
  chainId: SupportedChainId;
  key: "monadTestnet" | "baseSepolia" | "ethereumSepolia";
  name: string;
  network: AppKitNetwork;
  explorerUrl: string;
  rpcUrl: string;
  contracts: {
    sessions?: Address;
    badges?: Address;
  };
};

function contractAddress(value: string | undefined): Address | undefined {
  return value && isAddress(value) ? value : undefined;
}

const publicBetaContracts = {
  monadTestnet: {
    sessions: "0xBE1594148dDD4e7FF3A4ABbF47Be9a9fF2c59092",
    badges: "0xD53C628c4859A7460b5F2Ea0885bb4Da2d9fe1d1",
  },
  baseSepolia: {
    sessions: "0xBE1594148dDD4e7FF3A4ABbF47Be9a9fF2c59092",
    badges: "0xD53C628c4859A7460b5F2Ea0885bb4Da2d9fe1d1",
  },
  ethereumSepolia: {
    sessions: "0xBE1594148dDD4e7FF3A4ABbF47Be9a9fF2c59092",
    badges: "0xD53C628c4859A7460b5F2Ea0885bb4Da2d9fe1d1",
  },
} as const satisfies Record<
  BlockRoomChainConfig["key"],
  { sessions: Address; badges: Address }
>;

export const supportedChains: readonly BlockRoomChainConfig[] = [
  {
    chainId: monadTestnet.id,
    key: "monadTestnet",
    name: "Monad Testnet",
    network: monadTestnet,
    explorerUrl: monadTestnet.blockExplorers.default.url,
    rpcUrl:
      process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL ||
      monadTestnet.rpcUrls.default.http[0],
    contracts: {
      sessions: contractAddress(
        process.env.NEXT_PUBLIC_MONAD_TESTNET_SESSION_CONTRACT,
      ) ?? publicBetaContracts.monadTestnet.sessions,
      badges: contractAddress(
        process.env.NEXT_PUBLIC_MONAD_TESTNET_BADGE_CONTRACT,
      ) ?? publicBetaContracts.monadTestnet.badges,
    },
  },
  {
    chainId: baseSepolia.id,
    key: "baseSepolia",
    name: "Base Sepolia",
    network: baseSepolia,
    explorerUrl: baseSepolia.blockExplorers.default.url,
    rpcUrl:
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
      baseSepolia.rpcUrls.default.http[0],
    contracts: {
      sessions: contractAddress(
        process.env.NEXT_PUBLIC_BASE_SEPOLIA_SESSION_CONTRACT,
      ) ?? publicBetaContracts.baseSepolia.sessions,
      badges: contractAddress(
        process.env.NEXT_PUBLIC_BASE_SEPOLIA_BADGE_CONTRACT,
      ) ?? publicBetaContracts.baseSepolia.badges,
    },
  },
  {
    chainId: sepolia.id,
    key: "ethereumSepolia",
    name: "Ethereum Sepolia",
    network: sepolia,
    explorerUrl: sepolia.blockExplorers.default.url,
    rpcUrl:
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL ||
      sepolia.rpcUrls.default.http[0],
    contracts: {
      sessions: contractAddress(
        process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_SESSION_CONTRACT,
      ) ?? publicBetaContracts.ethereumSepolia.sessions,
      badges: contractAddress(
        process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_BADGE_CONTRACT,
      ) ?? publicBetaContracts.ethereumSepolia.badges,
    },
  },
];

export const defaultChainConfig = supportedChains[0];

export const appKitNetworks = supportedChains.map(
  (chain) => chain.network,
) as [AppKitNetwork, ...AppKitNetwork[]];

export const appKitRpcUrls = Object.fromEntries(
  supportedChains.map((chain) => [
    `eip155:${chain.chainId}`,
    [{ url: chain.rpcUrl }],
  ]),
);

export function isSupportedChainId(
  chainId: number | undefined,
): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

export function getChainConfig(
  chainId: number | undefined,
): BlockRoomChainConfig | undefined {
  return supportedChains.find((chain) => chain.chainId === chainId);
}

export function transactionExplorerUrl(
  chainId: number | undefined,
  hash?: Hex,
) {
  const chain = getChainConfig(chainId);
  return chain && hash ? `${chain.explorerUrl}/tx/${hash}` : undefined;
}

export function addressExplorerUrl(
  chainId: number | undefined,
  address?: Address,
) {
  const chain = getChainConfig(chainId);
  return chain && address ? `${chain.explorerUrl}/address/${address}` : undefined;
}
