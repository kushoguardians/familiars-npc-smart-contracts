import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FamiliarsModule from "./Familiars";
import FoodModule from "./Food";
import CoinsModule from "./Coins";
import KarmicEnergyModule from "./KarmicEnergy";
import ERC6551RegistryModule from "./ERC6551Registry";
import ERC6551AccountModule from "./ERC6551Account";
import MarketplaceModule from "./Marketplace";
import FamiliarsItemModule from "./FamiliarsItem";

const OperatorModule = buildModule("OperatorModule", (m) => {
  // Get contract instances from other modules
  const familiarsModule = m.useModule(FamiliarsModule);
  const foodModule = m.useModule(FoodModule);
  const coinsModule = m.useModule(CoinsModule);
  const karmicEnergyModule = m.useModule(KarmicEnergyModule);
  const registryModule = m.useModule(ERC6551RegistryModule);
  const accountModule = m.useModule(ERC6551AccountModule);
  const familiarsItemModule = m.useModule(FamiliarsItemModule);

  // Deploy marketplace with tokens
  const marketplace = m.contract("Marketplace", [
    foodModule.food,
    coinsModule.coins,
    karmicEnergyModule.karmicEnergy
  ]);

  const lib = m.library("FamiliarsLib");
  const operator = m.contract(
    "Operator",
    [
      familiarsModule.familiars,
      foodModule.food,
      coinsModule.coins,
      karmicEnergyModule.karmicEnergy,
      familiarsItemModule.familiarsItem,
      marketplace,  // Using the marketplace we just deployed
      registryModule.reg,
      accountModule.account,
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
  m.call(familiarsItemModule.familiarsItem, "setOperator", [operator]);
  m.call(foodModule.food, "setMarketplace", [marketplace]);
  m.call(coinsModule.coins, "setMarketplace", [marketplace]);
  m.call(karmicEnergyModule.karmicEnergy, "setMarketplace", [marketplace]);
  m.call(familiarsItemModule.familiarsItem, "setMarketplace", [marketplace]);
  m.call(marketplace, "setOperator", [operator]);

  return { operator, marketplace };
});

export default OperatorModule;