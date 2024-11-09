import { expect } from "chai";
import { ethers } from "hardhat";
import { Coins } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Coins Contract", function () {
  let coins: Coins;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let marketplace: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  // Use smaller numbers to avoid overflow
  const INITIAL_AMOUNT = 100n;
  const DECIMALS = 18n;
  const MULTIPLIER = 10n ** DECIMALS;

  beforeEach(async function () {
    [owner, operator, marketplace, addr1, addr2] = await ethers.getSigners();

    const CoinsFactory = await ethers.getContractFactory("Coins");
    coins = await CoinsFactory.deploy();

    // Set operator and marketplace
    await coins.setOperator(operator.address);
    await coins.setMarketplace(marketplace.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await coins.owner()).to.equal(owner.address);
    });

    it("Should set the initial operator and marketplace", async function () {
      expect(await coins.operator()).to.equal(operator.address);
      expect(await coins.marketplace()).to.equal(marketplace.address);
    });
  });

  describe("Minting", function () {
    it("Should allow operator to mint coins", async function () {
      await coins.connect(operator).mint(addr1.address, INITIAL_AMOUNT);
      const balance = await coins.balanceOf(addr1.address);
      expect(balance).to.equal(INITIAL_AMOUNT * MULTIPLIER);
    });

    it("Should allow marketplace to mint coins", async function () {
      await coins.connect(marketplace).mint(addr1.address, INITIAL_AMOUNT);
      const balance = await coins.balanceOf(addr1.address);
      expect(balance).to.equal(INITIAL_AMOUNT * MULTIPLIER);
    });

    it("Should not allow non-operator/marketplace to mint", async function () {
      await expect(
        coins.connect(addr1).mint(addr2.address, INITIAL_AMOUNT)
      ).to.be.revertedWith("Caller is not the operator or marketplace");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await coins.connect(operator).mint(addr1.address, INITIAL_AMOUNT);
      await coins
        .connect(addr1)
        .approve(operator.address, INITIAL_AMOUNT * MULTIPLIER);
    });

    it("Should allow regular users to transfer coins", async function () {
      const transferAmount = INITIAL_AMOUNT * MULTIPLIER;
      await coins
        .connect(operator)
        .transferFrom(addr1.address, addr2.address, transferAmount);
      const balance = await coins.balanceOf(addr2.address);
      expect(balance).to.equal(transferAmount);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to set new operator", async function () {
      await coins.connect(owner).setOperator(addr1.address);
      expect(await coins.operator()).to.equal(addr1.address);
    });

    it("Should allow owner to set new marketplace", async function () {
      await coins.connect(owner).setMarketplace(addr1.address);
      expect(await coins.marketplace()).to.equal(addr1.address);
    });

    it("Should not allow non-owner to set operator", async function () {
      await expect(coins.connect(addr1).setOperator(addr2.address)).to.be
        .reverted;
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await coins.connect(operator).mint(operator.address, INITIAL_AMOUNT);
    });

    it("Should allow operator to burn coins", async function () {
      const burnAmount = (INITIAL_AMOUNT * MULTIPLIER) / 2n;
      await coins.connect(operator).burn(burnAmount);
      const balance = await coins.balanceOf(operator.address);
      expect(balance).to.equal(INITIAL_AMOUNT * MULTIPLIER - burnAmount);
    });

    it("Should allow marketplace to burn from account", async function () {
      const burnAmount = (INITIAL_AMOUNT * MULTIPLIER) / 2n;
      await coins.connect(operator).approve(marketplace.address, burnAmount);
      await coins.connect(marketplace).burnFrom(operator.address, burnAmount);
      const balance = await coins.balanceOf(operator.address);
      expect(balance).to.equal(INITIAL_AMOUNT * MULTIPLIER - burnAmount);
    });
  });

  describe("Decimals", function () {
    it("Should have 18 decimals", async function () {
      expect(await coins.decimals()).to.equal(18);
    });

    it("Should handle decimal calculations correctly", async function () {
      const amount = 1n; // 1 token
      await coins.connect(operator).mint(addr1.address, amount);
      const balance = await coins.balanceOf(addr1.address);
      expect(balance).to.equal(MULTIPLIER); // 1 token = 10^18 base units
    });
  });

  describe("Approval and Allowance", function () {
    beforeEach(async function () {
      await coins.connect(operator).mint(addr1.address, INITIAL_AMOUNT);
      await coins.connect(operator).mint(operator.address, INITIAL_AMOUNT);
    });

    it("Should handle approvals correctly", async function () {
      const approvalAmount = INITIAL_AMOUNT * MULTIPLIER;
      await coins.connect(operator).approve(addr2.address, approvalAmount);
      const allowance = await coins.allowance(operator.address, addr2.address);
      expect(allowance).to.equal(approvalAmount);
    });

    it("Should handle transferFrom correctly when approved", async function () {
      const transferAmount = INITIAL_AMOUNT * MULTIPLIER;
      await coins
        .connect(operator)
        .approve(marketplace.address, transferAmount);
      await coins
        .connect(marketplace)
        .transferFrom(operator.address, addr2.address, transferAmount);
      const balance = await coins.balanceOf(addr2.address);
      expect(balance).to.equal(transferAmount);
    });
  });
});
