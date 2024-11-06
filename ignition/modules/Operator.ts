import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FamiliarsModule from "./Familiars";
import FoodModule from "./Food";
import CoinsModule from "./Coins";
import KarmicEnergyModule from "./KarmicEnergy";

const OperatorModule = buildModule("OperatorModule", (m) => {
  // Get contract instances from other modules
  const familiarsModule = m.useModule(FamiliarsModule);
  const foodModule = m.useModule(FoodModule);
  const coinsModule = m.useModule(CoinsModule);
  const karmicEnergyModule = m.useModule(KarmicEnergyModule);

  const lib = m.library("FamiliarsLib");
  const operator = m.contract(
    "Operator",
    [
      familiarsModule.familiars,
      foodModule.food,
      coinsModule.coins,
      karmicEnergyModule.karmicEnergy,
    ],
    {
      libraries: {
        FamiliarsLib: lib,
      },
    }
  );

  m.call(familiarsModule.familiars, "setOperator", [operator]);
  m.call(foodModule.food, "setOperator", [operator]);
  m.call(coinsModule.coins, "setOperator", [operator]);
  m.call(karmicEnergyModule.karmicEnergy, "setOperator", [operator]);

  return { operator };
});

export default OperatorModule;
