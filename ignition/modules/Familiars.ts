import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FamiliarsModule = buildModule("FamiliarsModule", (m) => {
  const familiars = m.contract("Familiars");
  return { familiars };
});

export default FamiliarsModule;
