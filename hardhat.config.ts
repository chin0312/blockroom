import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import nextEnv from "@next/env";
import { configVariable, defineConfig } from "hardhat/config";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    monadTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 10143,
      url: process.env.MONAD_TESTNET_RPC_URL ?? "https://testnet-rpc.monad.xyz",
      accounts: [configVariable("BLOCKROOM_DEPLOYER_PRIVATE_KEY")],
    },
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
      accounts: [configVariable("BLOCKROOM_DEPLOYER_PRIVATE_KEY")],
    },
    ethereumSepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url:
        process.env.ETHEREUM_SEPOLIA_RPC_URL ??
        "https://11155111.rpc.thirdweb.com",
      accounts: [configVariable("BLOCKROOM_DEPLOYER_PRIVATE_KEY")],
    },
  },
  chainDescriptors: {
    10143: {
      name: "monadTestnet",
      blockExplorers: {
        etherscan: {
          name: "Monad Testnet Explorer",
          url: "https://testnet.monadscan.com",
          apiUrl: "https://api.etherscan.io/v2/api",
        },
      },
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
