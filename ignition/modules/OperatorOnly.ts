import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OperatorModule = buildModule("OperatorModule", (m) => {
  // Define deployed contract addresses
  const DEPLOYED_ADDRESSES = {
    FAMILIARS: "0x1148F1DFfEa628Cd6a6E6Ca0602Bd693C92E595e",
    FOOD: "0x1dF7B1a050264C0B4D4Ba5982210fA52B8C99C3c",
    COINS: "0x21d51e07E5516D52992493cd634cB1e67Ae0e384",
    KARMIC_ENERGY: "0xB728A1997acc9F8F742e207C7afa2fC3A25AA17C",
    REGISTRY: "0x000000006551c19487814612e58FE06813775758",
    ACCOUNT: "0x55266d75D1a14E4572138116aF39863Ed6596E7F",
    FAMILIARS_ITEM: "0xd4c66834b429287B8F21526ADC33a15B1dD74F12",
    MARKETPLACE: "0x747f30550E69383310F312330873c72e31DE69D8",
    KARMIC_WELLSPRING: "0x3F21185928a9093D3639c2fa4EfF02c03731dE84",
    FAMILIARS_LIB: "0x630f4c4b9E412e5d356241dc7FDcad02fc26845B",
  };

  // Get contract instances using existing addresses
  const familiars = m.contractAt("Familiars", DEPLOYED_ADDRESSES.FAMILIARS);
  const food = m.contractAt("Food", DEPLOYED_ADDRESSES.FOOD);
  const coins = m.contractAt("Coins", DEPLOYED_ADDRESSES.COINS);
  const karmicEnergy = m.contractAt(
    "KarmicEnergy",
    DEPLOYED_ADDRESSES.KARMIC_ENERGY
  );
  const registry = m.contractAt("ERC6551Registry", DEPLOYED_ADDRESSES.REGISTRY);
  const account = m.contractAt("ERC6551Account", DEPLOYED_ADDRESSES.ACCOUNT);
  const familiarsItem = m.contractAt(
    "FamiliarsItem",
    DEPLOYED_ADDRESSES.FAMILIARS_ITEM
  );
  const marketplace = m.contractAt(
    "Marketplace",
    DEPLOYED_ADDRESSES.MARKETPLACE
  );
  const karmicwellspring = m.contractAt(
    "KarmicWellSpring",
    DEPLOYED_ADDRESSES.KARMIC_WELLSPRING
  );
  const lib = m.contractAt("FamiliarsLib", DEPLOYED_ADDRESSES.FAMILIARS_LIB);

  // Deploy operator with existing contracts
  const operator = m.contract(
    "Operator",
    [
      familiars,
      food,
      coins,
      karmicEnergy,
      familiarsItem,
      marketplace,
      karmicwellspring,
      registry,
      account,
    ],
    {
      libraries: {
        FamiliarsLib: lib,
      },
    }
  );

  // Set up contract relationships
  m.call(familiars, "setOperator", [operator]);
  m.call(food, "setOperator", [operator]);
  m.call(coins, "setOperator", [operator]);
  m.call(karmicEnergy, "setOperator", [operator]);
  m.call(familiarsItem, "setOperator", [operator]);
  m.call(marketplace, "setOperator", [operator]);
  m.call(karmicwellspring, "setOperator", [operator]);

  return { operator };
});

export default OperatorModule;
