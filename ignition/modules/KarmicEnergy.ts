import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const KarmicEnergyModule = buildModule("KarmicEnergyModule", (m) => {
  const karmicEnergy = m.contract("KarmicEnergy");
  return { karmicEnergy };
});

export default KarmicEnergyModule;
