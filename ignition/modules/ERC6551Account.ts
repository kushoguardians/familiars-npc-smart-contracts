import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC6551AccountModule = buildModule("ERC6551AccountModule", (m) => {
  const account = m.contract("ERC6551Account");
  return { account };
});

export default ERC6551AccountModule;
