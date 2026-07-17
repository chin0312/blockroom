import { describe, expect, it } from "vitest";
import {
  SUPPORTED_CHAIN_IDS,
  defaultChainConfig,
  getChainConfig,
  supportedChains,
} from "./chains";

describe("BlockRoom chain registry", () => {
  it("exposes exactly the three Public Beta networks", () => {
    expect(supportedChains.map((chain) => chain.name)).toEqual([
      "Monad Testnet",
      "Base Sepolia",
      "Ethereum Sepolia",
    ]);
    expect(new Set(SUPPORTED_CHAIN_IDS).size).toBe(3);
    expect(defaultChainConfig.name).toBe("Monad Testnet");
  });

  it("keeps RPC, explorer, and contract availability in one registry", () => {
    supportedChains.forEach((chain) => {
      expect(chain.rpcUrl).toMatch(/^https:\/\//);
      expect(chain.explorerUrl).toMatch(/^https:\/\//);
      expect(getChainConfig(chain.chainId)).toBe(chain);
    });
    expect(getChainConfig(1)).toBeUndefined();
  });
});
