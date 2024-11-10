import { expect } from "chai";
import { ethers } from "hardhat";
import {
  KarmicWellSpring,
  KarmicEnergy,
  Food,
  Coins,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("KarmicWellSpring Contract", function () {
  let karmicWellSpring: KarmicWellSpring;
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

    // Deploy KarmicWellSpring
    const KarmicWellSpringFactory = await ethers.getContractFactory(
      "KarmicWellSpring"
    );
    karmicWellSpring = await KarmicWellSpringFactory.deploy(
      await karmicEnergy.getAddress(),
      await food.getAddress(),
      await coins.getAddress()
    );

    const karmicwellspring = await karmicWellSpring.getAddress();

    // Set up permissions
    await karmicWellSpring.setOperator(operator.address);
    await karmicEnergy.setOperator(operator.address);
    await food.setOperator(operator.address);
    await coins.setOperator(operator.address);

    await karmicEnergy.setKarmicWellSpring(karmicwellspring);
    await food.setKarmicWellSpring(karmicwellspring);
    await coins.setKarmicWellSpring(karmicwellspring);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await karmicWellSpring.owner()).to.equal(owner.address);
    });

    it("Should set the correct operator", async function () {
      expect(await karmicWellSpring.operator()).to.equal(operator.address);
    });

    it("Should have correct token contracts", async function () {
      expect(await karmicWellSpring.karmicEnergy()).to.equal(
        await karmicEnergy.getAddress()
      );
      expect(await karmicWellSpring.food()).to.equal(await food.getAddress());
      expect(await karmicWellSpring.coins()).to.equal(await coins.getAddress());
    });
  });

  describe("Exchange Rate Management", function () {
    it("Should add new exchange rate", async function () {
      await karmicWellSpring.connect(owner).addExchangeRate(50, 10, 10);

      expect(await karmicWellSpring.validKarmicAmt(50)).to.be.true;
      expect(await karmicWellSpring.karmicToCoins(50)).to.equal(10);
      expect(await karmicWellSpring.karmicToFood(50)).to.equal(10);
    });

    it("Should update existing exchange rate", async function () {
      await karmicWellSpring.connect(owner).addExchangeRate(50, 10, 10);
      await karmicWellSpring.connect(owner).updateExchangeRate(50, 20, 20);

      expect(await karmicWellSpring.karmicToCoins(50)).to.equal(20);
      expect(await karmicWellSpring.karmicToFood(50)).to.equal(20);
    });

    it("Should remove exchange rate", async function () {
      await karmicWellSpring.connect(owner).addExchangeRate(50, 10, 10);
      await karmicWellSpring.connect(owner).removeExchangeRate(50);

      expect(await karmicWellSpring.validKarmicAmt(50)).to.be.false;
      expect(await karmicWellSpring.karmicToCoins(50)).to.equal(0);
      expect(await karmicWellSpring.karmicToFood(50)).to.equal(0);
    });

    it("Should fail to add invalid exchange rates", async function () {
      await expect(
        karmicWellSpring.connect(owner).addExchangeRate(0, 10, 10)
      ).to.be.revertedWith("Invalid karmic amount");

      await expect(
        karmicWellSpring.connect(owner).addExchangeRate(50, 0, 0)
      ).to.be.revertedWith("Invalid rewards");
    });

    it("Should fail when non-owner tries to modify rates", async function () {
      await expect(karmicWellSpring.connect(user).addExchangeRate(50, 10, 10))
        .to.be.reverted;

      await expect(
        karmicWellSpring.connect(user).updateExchangeRate(50, 20, 20)
      ).to.be.reverted;

      await expect(karmicWellSpring.connect(user).removeExchangeRate(50)).to.be
        .reverted;
    });
  });

  describe("Karmic Energy Exchange", function () {
    beforeEach(async function () {
      // Add exchange rate
      await karmicWellSpring.addExchangeRate(50, 10, 10);

      // Mint some karmic energy to user
      await karmicEnergy.connect(operator).mint(user.address, 100);
    });

    it("Should exchange karmic energy successfully", async function () {
      try {
        const decimal = await coins.decimals();
        await karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(50, user.address);

        expect(await karmicEnergy.balanceOf(user.address, 0)).to.equal(50);
        expect(await coins.balanceOf(user.address)).to.equal(
          10n * 10n ** decimal
        );
        expect(await food.balanceOf(user.address, 0)).to.equal(10);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it("Should fail with insufficient karmic energy", async function () {
      await karmicEnergy.connect(operator).burn(user.address, 0, 80);

      await expect(
        karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(50, user.address)
      ).to.be.revertedWith("Not enough karmic energy");
    });

    it("Should fail with invalid karmic amount", async function () {
      await expect(
        karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(75, user.address)
      ).to.be.revertedWith("Amount must be on valid tier");
    });

    it("Should fail when paused", async function () {
      await karmicWellSpring.connect(owner).setPauseContract(true);

      await expect(
        karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(50, user.address)
      ).to.be.reverted;
    });

    it("Should emit KarmicExchanged event", async function () {
      await expect(
        karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(50, user.address)
      )
        .to.emit(karmicWellSpring, "KarmicExchanged")
        .withArgs(user.address, 50, 10, 10);
    });
  });

  describe("Contract Management", function () {
    it("Should set new operator", async function () {
      await karmicWellSpring.connect(owner).setOperator(user.address);
      expect(await karmicWellSpring.operator()).to.equal(user.address);
    });

    it("Should fail when non-owner tries to set operator", async function () {
      await expect(karmicWellSpring.connect(user).setOperator(user.address)).to
        .be.reverted;
    });

    it("Should pause and unpause contract", async function () {
      await karmicWellSpring.connect(owner).setPauseContract(true);
      await expect(
        karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(50, user.address)
      ).to.be.reverted;

      await karmicWellSpring.connect(owner).setPauseContract(false);
      // Now the exchange should work (assuming proper setup)
      await karmicEnergy.connect(operator).mint(user.address, 100);
      await karmicWellSpring.connect(owner).addExchangeRate(50, 10, 10);
      await expect(
        karmicWellSpring
          .connect(operator)
          .exchangeKarmicEnergy(50, user.address)
      ).not.to.be.reverted;
    });
  });
});
