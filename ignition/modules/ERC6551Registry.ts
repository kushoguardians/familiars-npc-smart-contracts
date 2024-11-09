import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC6551RegistryModule = buildModule("ERC6551RegistryModule", (m) => {
  const reg = m.contract("ERC6551Registry");
  return { reg };
});

export default ERC6551RegistryModule;
