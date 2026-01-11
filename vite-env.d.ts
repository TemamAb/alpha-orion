/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string;
  readonly VITE_ETHERSCAN_API_KEY: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_NETWORK: string;
  readonly VITE_API_URL: string;
  readonly VITE_DEPLOYER_PRIVATE_KEY: string;
  readonly DEFAULT_WALLET_ADDRESS: string;
  readonly VITE_1CLICK_API_KEY: string;
  readonly VITE_DEXTOOLS_API_KEY: string;
  readonly VITE_BITQUERY_API_KEY: string;
  readonly VITE_FLASHBOTS_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
