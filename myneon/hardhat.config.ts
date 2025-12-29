import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "dotenv/config";
import { NetworkUserConfig } from "hardhat/types";

// Load environment variables
const {
  NEON_RPC_URL,
  NEON_DEVNET_URL,
  ETHEREUM_RPC_URL,
  POLYGON_RPC_URL,
  ARBITRUM_RPC_URL,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  COINMARKETCAP_API_KEY
} = process.env;

// Task to deploy all contracts
task("deploy", "Deploy all contracts")
  .addParam("network", "Network to deploy to")
  .setAction(async (taskArgs, hre) => {
    const { deployFlashLoan } = await import("./scripts/deployment/deploy-flashloan");
    await deployFlashLoan(taskArgs.network);
  });

// Task to run flash loan simulation
task("simulate", "Run flash loan simulation")
  .addParam("amount", "Amount to flash loan")
  .addParam("asset", "Asset to flash loan")
  .setAction(async (taskArgs, hre) => {
    const { simulateFlashLoan } = await import("./scripts/simulation/simulator");
    await simulateFlashLoan(taskArgs.asset, taskArgs.amount);
  });

// Task to verify contracts
task("verify:all", "Verify all contracts on explorer")
  .addParam("network", "Network to verify on")
  .setAction(async (taskArgs, hre) => {
    const { verifyAll } = await import("./scripts/verification/verifier");
    await verifyAll(taskArgs.network);
  });

// Network configurations
const networkConfig: Record<string, NetworkUserConfig> = {};

// Neon EVM Networks
if (NEON_RPC_URL && PRIVATE_KEY) {
  networkConfig.neon = {
    url: NEON_RPC_URL,
    chainId: 245022934,
    accounts: [PRIVATE_KEY],
    gasPrice: 1000000000, // 1 gwei
    timeout: 120000
  };
}

if (NEON_DEVNET_URL && PRIVATE_KEY) {
  networkConfig.neonDevnet = {
    url: NEON_DEVNET_URL,
    chainId: 245022926,
    accounts: [PRIVATE_KEY],
    gasPrice: 1000000000,
    timeout: 120000
  };
}

// Ethereum Networks
if (ETHEREUM_RPC_URL && PRIVATE_KEY) {
  networkConfig.ethereum = {
    url: ETHEREUM_RPC_URL,
    chainId: 1,
    accounts: [PRIVATE_KEY],
    gasPrice: "auto" as any
  };
  
  networkConfig.goerli = {
    url: ETHEREUM_RPC_URL.replace("mainnet", "goerli"),
    chainId: 5,
    accounts: [PRIVATE_KEY]
  };
}

// Polygon Networks
if (POLYGON_RPC_URL && PRIVATE_KEY) {
  networkConfig.polygon = {
    url: POLYGON_RPC_URL,
    chainId: 137,
    accounts: [PRIVATE_KEY],
    gasPrice: "auto" as any
  };
  
  networkConfig.mumbai = {
    url: POLYGON_RPC_URL.replace("mainnet", "polygon-mumbai"),
    chainId: 80001,
    accounts: [PRIVATE_KEY]
  };
}

// Arbitrum Networks
if (ARBITRUM_RPC_URL && PRIVATE_KEY) {
  networkConfig.arbitrum = {
    url: ARBITRUM_RPC_URL,
    chainId: 42161,
    accounts: [PRIVATE_KEY],
    gasPrice: "auto" as any
  };
  
  networkConfig.arbitrumGoerli = {
    url: ARBITRUM_RPC_URL.replace("mainnet", "arbitrum-goerli"),
    chainId: 421613,
    accounts: [PRIVATE_KEY]
  };
}

// Hardhat network for testing
networkConfig.hardhat = {
  chainId: 31337,
  forking: ETHEREUM_RPC_URL ? {
    url: ETHEREUM_RPC_URL,
    blockNumber: 18000000
  } : undefined,
  mining: {
    auto: true,
    interval: 5000
  },
  accounts: {
    mnemonic: "test test test test test test test test test test test junk",
    count: 10
  }
};

// Localhost network
networkConfig.localhost = {
  url: "http://127.0.0.1:8545",
  chainId: 31337
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "ipfs"
      },
      outputSelection: {
        "*": {
          "*": ["evm.bytecode", "evm.deployedBytecode", "abi"]
        }
      }
    }
  },
  networks: networkConfig,
  paths: {
    sources: "./contracts",
    tests: "./tests/contracts",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
    gasPrice: 100,
    excludeContracts: ["mocks/", "test/"]
  },
  etherscan: {
    apiKey: {
      neon: "neon", // NeonScan doesn't require API key
      neonDevnet: "neon",
      mainnet: ETHERSCAN_API_KEY || "",
      goerli: ETHERSCAN_API_KEY || "",
      polygon: ETHERSCAN_API_KEY || "",
      polygonMumbai: ETHERSCAN_API_KEY || "",
      arbitrumOne: ETHERSCAN_API_KEY || "",
      arbitrumGoerli: ETHERSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "neon",
        chainId: 245022934,
        urls: {
          apiURL: "https://api.neonscan.org/api",
          browserURL: "https://neonscan.org"
        }
      },
      {
        network: "neonDevnet",
        chainId: 245022926,
        urls: {
          apiURL: "https://api-devnet.neonscan.org/api",
          browserURL: "https://devnet.neonscan.org"
        }
      }
    ]
  },
  mocha: {
    timeout: 60000
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true
  }
};

export default config;
