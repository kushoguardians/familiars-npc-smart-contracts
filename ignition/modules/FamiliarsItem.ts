import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FamiliarsItemModule = buildModule("FamiliarsItemModule", (m) => {
  const familiarsItem = m.contract("FamiliarsItem");
  return { familiarsItem };
});

export default FamiliarsItemModule;
