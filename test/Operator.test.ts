import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Operator,
  Familiars,
  Coins,
  KarmicEnergy,
  Food,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Operator Contract", function () {
  let operator: Operator;
  let familiars: Familiars;
  let coins: Coins;
  let karmicEnergy: KarmicEnergy;
  let food: Food;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  // Constants for testing
  const TOKEN_URI = "ipfs://QmTest";
  const INITIAL_HEALTH = 50;

  // Location enum mapping
  enum Location {
    KARMIC_WELLSPRING,
    KARMIC_TOWER,
    HOME,
    GATHERING_AREA,
  }

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    // Deploy the FamiliarsLib library
    const FamiliarsLibFactory = await ethers.getContractFactory("FamiliarsLib");
    const familiarsLib = await FamiliarsLibFactory.deploy();
    await familiarsLib.waitForDeployment();

    // Deploy all required contracts
    const FamiliarsFactory = await ethers.getContractFactory("Familiars");
    familiars = await FamiliarsFactory.deploy();

    const CoinsFactory = await ethers.getContractFactory("Coins");
    coins = await CoinsFactory.deploy();

    const KarmicEnergyFactory = await ethers.getContractFactory("KarmicEnergy");
    karmicEnergy = await KarmicEnergyFactory.deploy();

    const FoodFactory = await ethers.getContractFactory("Food");
    food = await FoodFactory.deploy();

    const OperatorFactory = await ethers.getContractFactory("Operator", {
      libraries: {
        FamiliarsLib: familiarsLib,
      },
    });
    operator = await OperatorFactory.deploy(
      await familiars.getAddress(),
      await food.getAddress(),
      await coins.getAddress(),
      await karmicEnergy.getAddress()
    );

    const operatorAddress = await operator.getAddress();

    // Grant operator status
    await familiars.setOperator(operatorAddress);
    await coins.setOperator(operatorAddress);
    await karmicEnergy.setOperator(operatorAddress);
    await food.setOperator(operatorAddress);
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
    });

    it("Should have correct operator contract addresses", async function () {
      const operatorAddress = await operator.getAddress();
      expect(await familiars.operator()).to.equal(operatorAddress);
      expect(await familiars.operator()).to.equal(operatorAddress);
      expect(await familiars.operator()).to.equal(operatorAddress);
      expect(await operator.food()).to.equal(await food.getAddress());
    });
  });

  describe("NPC Creation", function () {
    it("Should allow creating new NPCs", async function () {
      await operator.createNPC(addr1.address, TOKEN_URI);
      expect(await familiars.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should not allow creating NPCs when paused", async function () {
      await operator.setPauseContract(true);
      await expect(
        operator.createNPC(addr1.address, TOKEN_URI)
      ).to.be.revertedWithCustomError(operator, "EnforcedPause");
    });
  });

  describe("Location Requirements", function () {
    const req = {
      minHealth: 10,
      healthCost: 5,
      minKarmicEnergy: 10,
      karmicEnergyCost: 5,
      minFood: 10,
      foodCost: 5,
      minCoin: 10,
      coinCost: 5,
      getCoin: 2,
      getHealth: 2,
      getKarmicEnergy: 2,
      getFood: 2,
    };

    it("Should allow owner to set location requirements", async function () {
      await operator.setLocationRequirements(Location.GATHERING_AREA, req);
      const result = await operator.getLocationRequirements(
        Location.GATHERING_AREA
      );
      // Compare individual values instead of the whole object
      expect(Number(result[0])).to.equal(req.minHealth);
      expect(Number(result[1])).to.equal(req.healthCost);
      expect(Number(result[2])).to.equal(req.minKarmicEnergy);
      expect(Number(result[3])).to.equal(req.karmicEnergyCost);
      expect(Number(result[4])).to.equal(req.minFood);
      expect(Number(result[5])).to.equal(req.foodCost);
      expect(Number(result[6])).to.equal(req.minCoin);
      expect(Number(result[7])).to.equal(req.coinCost);
      expect(Number(result[8])).to.equal(req.getCoin);
      expect(Number(result[9])).to.equal(req.getHealth);
      expect(Number(result[10])).to.equal(req.getKarmicEnergy);
      expect(Number(result[11])).to.equal(req.getFood);
    });

    it("Should not allow non-owner to set requirements", async function () {
      await expect(
        operator
          .connect(addr1)
          .setLocationRequirements(Location.GATHERING_AREA, req)
      ).to.be.revertedWithCustomError(operator, "OwnableUnauthorizedAccount");
    });
  });

  describe("Location Movement", function () {
    beforeEach(async function () {
      await operator.createNPC(addr1.address, TOKEN_URI);
      await operator.setLocationRequirements(Location.GATHERING_AREA, {
        minHealth: 10,
        healthCost: 5,
        minKarmicEnergy: 10,
        karmicEnergyCost: 5,
        minFood: 10,
        foodCost: 5,
        minCoin: 10,
        coinCost: 5,
        getCoin: 2,
        getHealth: 2,
        getKarmicEnergy: 2,
        getFood: 2,
      });
    });

    it("Should allow movement with sufficient resources", async function () {
      await operator.giveCoinsToNPC(addr1.address, 20);
      await operator.giveFoodToNPC(addr1.address, 20);
      await operator.giveKarmicEnergyToNPC(addr1.address, 20);

      await operator.goToLocation(1, addr1.address, Location.GATHERING_AREA);
      expect(await familiars.getCurrentLocation(1)).to.equal("Gathering Area");
    });

    it("Should fail movement with insufficient resources", async function () {
      await expect(
        operator.goToLocation(1, addr1.address, Location.GATHERING_AREA)
      ).to.be.reverted;
    });
  });

  describe("Stats Management", function () {
    beforeEach(async function () {
      await operator.createNPC(addr1.address, TOKEN_URI);
    });

    it("Should return correct NPC stats", async function () {
      const [health, location] = await operator.getNPCStats(1);
      expect(health).to.equal(INITIAL_HEALTH);
      expect(location).to.equal("Home");
    });
  });
});
