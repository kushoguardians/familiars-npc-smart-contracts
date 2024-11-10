import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const PRIVATEKEY_DEV = vars.get("PRIVATEKEY_DEV");
const BASE_SEPOLIA_RPC = vars.get("BASE_SEPOLIA_RPC");
const BLOCKSCOUT_API_KEY = vars.get("BLOCKSCOUT_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      accounts: [PRIVATEKEY_DEV],
    },
  },
  etherscan: {
    apiKey: {
      "base-sepolia": BLOCKSCOUT_API_KEY,
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://base-sepolia.blockscout.com/api",
          browserURL: "https://base-sepolia.blockscout.com",
        },
      },
    ],
  },
};

export default config;
