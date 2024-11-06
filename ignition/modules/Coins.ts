import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CoinsModule = buildModule("CoinsModule", (m) => {
  const coins = m.contract("Coins");
  return { coins };
});

export default CoinsModule;
