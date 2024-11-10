import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Operator,
  Familiars,
  Coins,
  KarmicEnergy,
  Food,
  FamiliarsItem,
  Marketplace,
  ERC6551Account,
  FamiliarsLib,
  ERC6551Registry,
  KarmicWellSpring,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Operator Contract", function () {
  let operator: Operator;
  let familiars: Familiars;
  let coins: Coins;
  let karmicEnergy: KarmicEnergy;
  let food: Food;
  let registry: ERC6551Registry;
  let familiarsItem: FamiliarsItem;
  let familiarsLib: FamiliarsLib;
  let karmicwellspring: KarmicWellSpring;
  let marketplace: Marketplace;
  let tbaImpl: ERC6551Account;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  // Constants for testing
  const TOKEN_URI = "ipfs://QmTest";
  const CHAIN_ID = 84532;
  const SALT = 3123;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy all required contracts
    const FamiliarsFactory = await ethers.getContractFactory("Familiars");
    familiars = await FamiliarsFactory.deploy();

    const FamiliarsLibFactory = await ethers.getContractFactory("FamiliarsLib");
    familiarsLib = await FamiliarsLibFactory.deploy();

    const TbaImplFactory = await ethers.getContractFactory("ERC6551Account");
    tbaImpl = await TbaImplFactory.deploy();

    const CoinsFactory = await ethers.getContractFactory("Coins");
    coins = await CoinsFactory.deploy();

    const KarmicEnergyFactory = await ethers.getContractFactory("KarmicEnergy");
    karmicEnergy = await KarmicEnergyFactory.deploy();

    const FoodFactory = await ethers.getContractFactory("Food");
    food = await FoodFactory.deploy();

    const FamiliarsItemFactory = await ethers.getContractFactory(
      "FamiliarsItem"
    );
    familiarsItem = await FamiliarsItemFactory.deploy();

    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");

    const RegistryFactory = await ethers.getContractFactory("ERC6551Registry");
    registry = await RegistryFactory.deploy();

    const OperatorFactory = await ethers.getContractFactory("Operator", {
      libraries: {
        FamiliarsLib: familiarsLib,
      },
    });

    // Deploy all required contracts
    const karmicSpringFactory = await ethers.getContractFactory(
      "KarmicWellSpring"
    );
    karmicwellspring = await karmicSpringFactory.deploy(
      await karmicEnergy.getAddress(),
      await food.getAddress(),
      await coins.getAddress()
    );

    marketplace = await MarketplaceFactory.deploy(
      await karmicEnergy.getAddress(),
      await food.getAddress(),
      await coins.getAddress()
    );
    operator = await OperatorFactory.deploy(
      await familiars.getAddress(),
      await food.getAddress(),
      await coins.getAddress(),
      await karmicEnergy.getAddress(),
      await familiarsItem.getAddress(),
      await marketplace.getAddress(),
      await karmicwellspring.getAddress(),
      await registry.getAddress(),
      await tbaImpl.getAddress()
    );

    const operatorAddress = await operator.getAddress();
    const marketPlaceAddress = await marketplace.getAddress();
    const wellspring = await karmicwellspring.getAddress();

    // Grant operator status
    await familiars.setOperator(operatorAddress);
    await coins.setOperator(operatorAddress);
    await karmicEnergy.setOperator(operatorAddress);
    await food.setOperator(operatorAddress);
    await familiarsItem.setOperator(operatorAddress);
    await coins.setMarketplace(marketPlaceAddress);
    await karmicEnergy.setMarketplace(marketPlaceAddress);
    await food.setMarketplace(marketPlaceAddress);
    await marketplace.setOperator(operatorAddress);
    await karmicwellspring.setOperator(operatorAddress);

    await coins.setKarmicWellSpring(wellspring);
    await karmicEnergy.setKarmicWellSpring(wellspring);
    await food.setKarmicWellSpring(wellspring);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await operator.owner()).to.equal(owner.address);
    });

    it("Should have correct contract addresses", async function () {
      expect(await operator.familiars()).to.equal(await familiars.getAddress());
      expect(await operator.coins()).to.equal(await coins.getAddress());
      expect(await operator.karmicEnergy()).to.equal(
        await karmicEnergy.getAddress()
      );
      expect(await operator.food()).to.equal(await food.getAddress());
      expect(await operator.familiarsItem()).to.equal(
        await familiarsItem.getAddress()
      );
      expect(await operator.marketplace()).to.equal(
        await marketplace.getAddress()
      );
    });
  });

  describe("NPC Creation", function () {
    it("Should create NPC with valid signature", async function () {
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));

      await operator.createNPC(addr1.address, TOKEN_URI, signature, "0x");
      expect(await familiars.ownerOf(1)).to.equal(addr1.address);
      expect(await operator.nonce()).to.equal(nonce + 1n);
    });

    it("Should fail with invalid signature", async function () {
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, addr1.address]
      );
      const signature = await addr1.signMessage(ethers.getBytes(message));

      await expect(
        operator.createNPC(addr1.address, TOKEN_URI, signature, "0x")
      ).to.be.revertedWith("Invalid signature");
    });
  });

  describe("Location Movement", function () {
    beforeEach(async function () {
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));
      await operator.createNPC(addr1.address, TOKEN_URI, signature, "0x");
    });

    it("Should move to location with valid signature", async function () {
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));

      await operator.goToLocation(1, 3, signature); // 3 = GATHERING_AREA
      expect(await familiars.getCurrentLocation(1)).to.deep.equal([
        "Gathering Area",
        3,
      ]);
    });
  });

  describe("Equipment Management", function () {
    const itemAttributes = {
      healthIncrease: 5,
      healthDecrease: 0,
      karmicIncrease: 5,
      karmicDecrease: 0,
      foodIncrease: 5,
      foodDecrease: 0,
      coinIncrease: 5,
      coinDecrease: 0,
      luckIncrease: 5,
      luckDecrease: 0,
    };

    beforeEach(async function () {
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));
      await operator.createNPC(addr1.address, TOKEN_URI, signature, "0x");
    });

    it("Should equip items with valid signature", async function () {
      // First mint some items
      const tba = await operator._getTba(1);
      await familiarsItem.ownerMint(tba, 1, 10, itemAttributes);
      await familiarsItem.ownerMint(tba, 2, 10, itemAttributes);

      let nonce = await operator.nonce();
      let message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      let signature = await owner.signMessage(ethers.getBytes(message));

      await operator.connect(owner).equipItem(1, 1, 2, signature);

      const equippedItems = await familiars.getEquippedItems(1);

      expect(equippedItems.mouth).to.equal(1);
      expect(equippedItems.head).to.equal(2);
    });
  });

  describe("Stats Management", function () {
    beforeEach(async function () {
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));
      await operator.createNPC(addr1.address, TOKEN_URI, signature, "0x");
    });

    it("Should return correct NPC stats", async function () {
      const [
        health,
        location,
        coinBalance,
        karmicBalance,
        foodBalance,
        equippedItems,
      ] = await operator.getNPCStats(1);

      expect(health).to.equal(100);
      expect(location).to.equal("Home");
      expect(coinBalance).to.equal(0);
      expect(karmicBalance).to.equal(0);
      expect(foodBalance).to.equal(0);
      expect(equippedItems.mouth).to.equal(0);
      expect(equippedItems.head).to.equal(0);
    });
  });

  describe("Karmic Exchange", function () {
    const requirements = {
      minHealth: 1,
      healthCost: 10,
      minKarmicEnergy: 0,
      karmicEnergyCost: 0,
      minFood: 0,
      foodCost: 0,
      minCoin: 0,
      coinCost: 0,
      getCoin: 100,
      getHealth: 10,
      getKarmicEnergy: 50,
      getFood: 100,
    };
    beforeEach(async function () {
      // Create NPC
      const nonce = await operator.nonce();
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));
      await operator.createNPC(addr1.address, TOKEN_URI, signature, "0x");

      // Set up exchange rates in karmicwellspring
      await karmicwellspring.connect(owner).addExchangeRate(50, 10, 10); // 50 karmic -> 10 coins, 10 food
      await karmicwellspring.connect(owner).addExchangeRate(100, 25, 25); // 100 karmic -> 25 coins, 25 food
    });

    describe("Exchange Rate Management", function () {
      it("Should add new exchange rates correctly", async function () {
        await karmicwellspring.connect(owner).addExchangeRate(75, 15, 15);

        expect(await karmicwellspring.validKarmicAmt(75)).to.be.true;
        expect(await karmicwellspring.karmicToCoins(75)).to.equal(15);
        expect(await karmicwellspring.karmicToFood(75)).to.equal(15);
      });

      it("Should update existing exchange rates", async function () {
        await karmicwellspring.connect(owner).updateExchangeRate(50, 20, 20);

        expect(await karmicwellspring.karmicToCoins(50)).to.equal(20);
        expect(await karmicwellspring.karmicToFood(50)).to.equal(20);
      });

      it("Should remove exchange rates", async function () {
        await karmicwellspring.connect(owner).removeExchangeRate(50);

        expect(await karmicwellspring.validKarmicAmt(50)).to.be.false;
        expect(await karmicwellspring.karmicToCoins(50)).to.equal(0);
        expect(await karmicwellspring.karmicToFood(50)).to.equal(0);
      });

      it("Should fail to add invalid exchange rates", async function () {
        await expect(
          karmicwellspring.connect(owner).addExchangeRate(0, 10, 10)
        ).to.be.revertedWith("Invalid karmic amount");

        await expect(
          karmicwellspring.connect(owner).addExchangeRate(50, 0, 0)
        ).to.be.revertedWith("Invalid rewards");
      });

      it("Should fail when non-operator tries to modify rates", async function () {
        await expect(
          karmicwellspring.connect(addr1).addExchangeRate(75, 15, 15)
        ).to.be.reverted;

        await expect(
          karmicwellspring.connect(addr1).updateExchangeRate(50, 20, 20)
        ).to.be.reverted;

        await expect(karmicwellspring.connect(addr1).removeExchangeRate(50)).to
          .be.reverted;
      });
    });

    describe("Karmic Energy Exchange", function () {
      beforeEach(async function () {
        let nonce = await operator.nonce();

        let message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        let signature = await owner.signMessage(ethers.getBytes(message));
        await familiars.setLocationRequirements(1, requirements);
        await operator.goToLocation(1, 1, signature);
        nonce = await operator.nonce();

        message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        signature = await owner.signMessage(ethers.getBytes(message));

        await operator.goToLocation(1, 0, signature);
      });
      it("Should exchange karmic energy for rewards successfully", async function () {
        const tba = await operator._getTba(1);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        // Initial balances
        const initialKarmic = await karmicEnergy.balanceOf(tba, 0);
        const initialCoins = await coins.balanceOf(tba);
        const initialFood = await food.balanceOf(tba, 0);

        // Exchange 50 karmic energy
        await operator.exchangeKarmicEnergy(1, 50, signature);
        const decimal = await coins.decimals();
        const coinsLatest = 10n * 10n ** decimal;

        // Check final balances
        expect(await karmicEnergy.balanceOf(tba, 0)).to.equal(
          initialKarmic - 50n
        );
        expect(await coins.balanceOf(tba)).to.equal(coinsLatest + initialCoins);
        expect(await food.balanceOf(tba, 0)).to.equal(initialFood + 10n);
      });

      it("Should fail exchange with insufficient karmic energy", async function () {
        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );

        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.exchangeKarmicEnergy(1, 100, signature)).to.be
          .reverted;
      });

      it("Should fail exchange with invalid karmic amount", async function () {
        let nonce = await operator.nonce();
        let message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        let signature = await owner.signMessage(ethers.getBytes(message));

        nonce = await operator.nonce();
        message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );

        signature = await owner.signMessage(ethers.getBytes(message));
        await expect(operator.exchangeKarmicEnergy(1, 752, signature)).to.be
          .reverted;
      });

      it("Should fail exchange when paused", async function () {
        const tba = await operator._getTba(1);

        await karmicwellspring.connect(owner).setPauseContract(true);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.exchangeKarmicEnergy(1, 50, signature)).to.be
          .reverted;
      });

      it("Should emit KarmicExchanged event", async function () {
        const tba = await operator._getTba(1);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.exchangeKarmicEnergy(1, 50, signature))
          .to.emit(karmicwellspring, "KarmicExchanged")
          .withArgs(tba, 50, 10, 10);
      });
    });

    describe("karmicwellspring Integration", function () {
      const requirements = {
        minHealth: 1,
        healthCost: 10,
        minKarmicEnergy: 0,
        karmicEnergyCost: 0,
        minFood: 0,
        foodCost: 0,
        minCoin: 0,
        coinCost: 0,
        getCoin: 0,
        getHealth: 10,
        getKarmicEnergy: 150,
        getFood: 0,
      };
      beforeEach(async () => {
        let nonce = await operator.nonce();

        let message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        let signature = await owner.signMessage(ethers.getBytes(message));
        await familiars.setLocationRequirements(1, requirements);
        const tba = await operator._getTba(1);
        await operator.goToLocation(1, 1, signature);
        nonce = await operator.nonce();

        message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        signature = await owner.signMessage(ethers.getBytes(message));

        await operator.goToLocation(1, 0, signature);
      });
      it("Should handle multiple exchanges correctly", async function () {
        const tba = await operator._getTba(1);
        const initialCoin = await coins.balanceOf(tba);
        const decimals = await coins.decimals();

        let nonce = await operator.nonce();
        let message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        let signature = await owner.signMessage(ethers.getBytes(message));

        // First exchange - 50 KE should give 10 coins
        await operator.exchangeKarmicEnergy(1, 50, signature);

        // Second exchange - 100 KE should give 25 coins
        nonce = await operator.nonce();
        message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        signature = await owner.signMessage(ethers.getBytes(message));

        await operator.exchangeKarmicEnergy(1, 100, signature);

        const karmicCoinExchange = 35n * 10n ** decimals; // 10 + 25 exchange

        // Check final balances
        expect(await karmicEnergy.balanceOf(tba, 0)).to.equal(0);
        expect(await coins.balanceOf(tba)).to.equal(
          initialCoin + karmicCoinExchange
        );
        expect(await food.balanceOf(tba, 0)).to.equal(35n); // 10 + 25
      });

      it("Should calculate rewards correctly", async function () {
        const [coins, food] = await karmicwellspring._calculateRewards(50);
        expect(coins).to.equal(10n);
        expect(food).to.equal(10n);

        const [coins2, food2] = await karmicwellspring._calculateRewards(100);
        expect(coins2).to.equal(25n);
        expect(food2).to.equal(25n);
      });
    });
  });

  describe("Treasure Box and Food Exchange", function () {
    const requirements = {
      minHealth: 1,
      healthCost: 10,
      minKarmicEnergy: 0,
      karmicEnergyCost: 0,
      minFood: 0,
      foodCost: 0,
      minCoin: 0,
      coinCost: 0,
      getCoin: 100,
      getHealth: 10,
      getKarmicEnergy: 50,
      getFood: 0,
    };
    beforeEach(async function () {
      // Create NPC
      let nonce = await operator.nonce();
      let message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      let signature = await owner.signMessage(ethers.getBytes(message));
      await operator.createNPC(addr1.address, TOKEN_URI, signature, "0x");
      nonce = await operator.nonce();
      message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [nonce, CHAIN_ID, owner.address]
      );
      signature = await owner.signMessage(ethers.getBytes(message));
      await familiars.setLocationRequirements(1, requirements);
      await operator.goToLocation(1, 1, signature);
    });

    describe("Buy Treasure Box", function () {
      beforeEach(async function () {});

      it("Should successfully buy a treasure box", async function () {
        let tba = await operator._getTba(1);
        let initialCoins = await coins.balanceOf(tba);

        let nonce = await operator.nonce();
        let message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        let signature = await owner.signMessage(ethers.getBytes(message));
        await operator.goToLocation(1, 4, signature);
        nonce = await operator.nonce();
        message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        signature = await owner.signMessage(ethers.getBytes(message));
        await operator.buyTreasureBox(1, signature);

        const finalCoins = await coins.balanceOf(tba);

        expect(finalCoins).to.be.not.equal(initialCoins);
      });

      it("Should fail to buy treasure box with insufficient coins", async function () {
        const tba = await operator._getTba(1);
        // Spend all coins
        const balance = await coins.balanceOf(tba);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.buyTreasureBox(1, signature)).to.be.reverted;
      });

      it("Should fail to buy treasure box when marketplace is paused", async function () {
        await marketplace.setPauseContract(true);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.buyTreasureBox(1, signature)).to.be.reverted;
      });
    });

    describe("Exchange Food to Coins", function () {
      beforeEach(async function () {
        const tba = await operator._getTba(1);
        let nonce = await operator.nonce();
        let message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        let signature = await owner.signMessage(ethers.getBytes(message));
        await operator.goToLocation(1, 4, signature);
      });

      it("Should successfully exchange food for coins", async function () {
        const tba = await operator._getTba(1);
        const initialFood = await food.balanceOf(tba, 0);
        const initialCoins = await coins.balanceOf(tba);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        const foodAmount = 50;
        await operator.buyFoodToMarketplace(1, foodAmount, signature);

        const finalFood = await food.balanceOf(tba, 0);
        const finalCoins = await coins.balanceOf(tba);

        expect(finalFood).to.equal(BigInt(foodAmount) - initialFood);
        expect(finalCoins).to.be.lt(initialCoins);
      });

      it("Should fail to exchange food with insufficient balance", async function () {
        const tba = await operator._getTba(1);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.buyFoodToMarketplace(1, 150, signature)).to.be
          .reverted;
      });

      it("Should fail to exchange food when marketplace is paused", async function () {
        await marketplace.setPauseContract(true);

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.buyFoodToMarketplace(1, 50, signature)).to.be
          .reverted;
      });

      it("Should emit FoodExchanged event", async function () {
        const tba = await operator._getTba(1);
        const foodAmount = 50;

        const nonce = await operator.nonce();
        const message = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "address"],
          [nonce, CHAIN_ID, owner.address]
        );
        const signature = await owner.signMessage(ethers.getBytes(message));

        await expect(operator.buyFoodToMarketplace(1, foodAmount, signature))
          .to.emit(marketplace, "FoodExchange")
          .withArgs(tba, foodAmount, foodAmount);
      });
    });
  });
});
