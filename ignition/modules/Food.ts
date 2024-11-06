import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FoodModule = buildModule("FoodModule", (m) => {
  const food = m.contract("Food");
  return { food };
});

export default FoodModule;