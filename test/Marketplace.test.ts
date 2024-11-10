import { expect } from "chai";
import { ethers } from "hardhat";
import { Marketplace, KarmicEnergy, Food, Coins } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Marketplace Contract", function () {
  let marketplace: Marketplace;
  let karmicEnergy: KarmicEnergy;
  let food: Food;
  let coins: Coins;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, operator, user] = await ethers.getSigners();

    // Deploy tokens
    const KarmicEnergyFactory = await ethers.getContractFactory("KarmicEnergy");
    karmicEnergy = await KarmicEnergyFactory.deploy();

    const FoodFactory = await ethers.getContractFactory("Food");
    food = await FoodFactory.deploy();

    const CoinsFactory = await ethers.getContractFactory("Coins");
    coins = await CoinsFactory.deploy();

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy(
      await karmicEnergy.getAddress(),
      await food.getAddress(),
      await coins.getAddress()
    );

    const marketplaceAddress = await marketplace.getAddress();

    // Set up permissions
    await marketplace.setOperator(operator.address);
    await karmicEnergy.setOperator(operator.address);
    await food.setOperator(operator.address);
    await coins.setOperator(operator.address);

    await karmicEnergy.setMarketplace(marketplaceAddress);
    await food.setMarketplace(marketplaceAddress);
    await coins.setMarketplace(marketplaceAddress);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should set the correct operator", async function () {
      expect(await marketplace.operator()).to.equal(operator.address);
    });

    it("Should have correct token contracts", async function () {
      expect(await marketplace.karmicEnergy()).to.equal(
        await karmicEnergy.getAddress()
      );
      expect(await marketplace.food()).to.equal(await food.getAddress());
      expect(await marketplace.coins()).to.equal(await coins.getAddress());
    });
  });

  describe("Food Exchange", function () {
    beforeEach(async function () {
      // Mint some coins to user for testing

      await coins.connect(operator).mint(user.address, 100);
    });

    it("Should exchange coins for food successfully", async function () {
      const initialCoinBalance = await coins.balanceOf(user.address);
      const initialFoodBalance = await food.balanceOf(user.address, 0);
      const exchangeAmount = 10;

      await marketplace
        .connect(operator)
        .exchangeCoinsToFood(exchangeAmount, user.address);

      const finalCoinBalance = await coins.balanceOf(user.address);
      const finalFoodBalance = await food.balanceOf(user.address, 0);

      expect(finalCoinBalance).to.be.lt(initialCoinBalance);
      expect(finalFoodBalance).to.equal(
        initialFoodBalance + BigInt(exchangeAmount)
      );
    });

    it("Should fail with insufficient coins", async function () {
      const balance = await coins.balanceOf(user.address);
      await coins.connect(operator).burnCoins(user.address, balance);

      await expect(
        marketplace.connect(operator).exchangeCoinsToFood(10, user.address)
      ).to.be.revertedWith("Not enough coins");
    });

    it("Should fail with zero amount", async function () {
      await expect(
        marketplace.connect(operator).exchangeCoinsToFood(0, user.address)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should emit FoodExchange event", async function () {
      const exchangeAmount = 10;
      await expect(
        marketplace
          .connect(operator)
          .exchangeCoinsToFood(exchangeAmount, user.address)
      )
        .to.emit(marketplace, "FoodExchange")
        .withArgs(user.address, exchangeAmount, exchangeAmount);
    });
  });

  describe("Treasure Box Purchase", function () {
    beforeEach(async function () {
      // Mint some coins to user for testing

      await coins.connect(operator).mint(user.address, 100);
    });

    it("Should buy treasure box successfully", async function () {
      const initialCoinBalance = await coins.balanceOf(user.address);

      await marketplace.connect(operator).buyTreasureBox(user.address);

      const finalCoinBalance = await coins.balanceOf(user.address);

      expect(finalCoinBalance).to.be.not.equal(initialCoinBalance);
    });

    it("Should fail with insufficient coins", async function () {
      const balance = await coins.balanceOf(user.address);
      await coins.connect(operator).burnCoins(user.address, balance);

      await expect(
        marketplace.connect(operator).buyTreasureBox(user.address)
      ).to.be.revertedWith("Not enough coins");
    });
  });

  describe("Contract Management", function () {
    it("Should set new operator", async function () {
      await marketplace.connect(owner).setOperator(user.address);
      expect(await marketplace.operator()).to.equal(user.address);
    });

    it("Should fail when non-owner tries to set operator", async function () {
      await expect(marketplace.connect(user).setOperator(user.address)).to.be
        .reverted;
    });

    it("Should pause and unpause contract", async function () {
      await marketplace.connect(owner).setPauseContract(true);
      await expect(
        marketplace.connect(operator).exchangeCoinsToFood(10, user.address)
      ).to.be.reverted;

      await marketplace.connect(owner).setPauseContract(false);

      await coins.connect(operator).mint(user.address, 100);
      await expect(
        marketplace.connect(operator).exchangeCoinsToFood(10, user.address)
      ).not.to.be.reverted;
    });
  });
});
