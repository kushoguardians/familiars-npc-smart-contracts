import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATEKEY_DEV = vars.get("PRIVATEKEY_DEV");
const BASE_SEPOLIA_RPC = vars.get("BASE_SEPOLIA_RPC");

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      accounts: [PRIVATEKEY_DEV],
    },
  },
};

export default config;
