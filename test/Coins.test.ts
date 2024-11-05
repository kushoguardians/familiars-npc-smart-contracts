import { expect } from "chai";
import { ethers } from "hardhat";
import { Coins } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Coins", function () {
  let coins: Coins;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const CoinsFactory = await ethers.getContractFactory("Coins");
    coins = await CoinsFactory.deploy();
    await coins.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await coins.owner()).to.equal(await owner.getAddress());
    });

    it("Should have correct name and symbol", async function () {
      expect(await coins.name()).to.equal("Coins");
      expect(await coins.symbol()).to.equal("Coins");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = 100;
      await coins.mint(addr1.address, mintAmount);
      const expectedAmount = BigInt(mintAmount) * BigInt(10 ** 18); // 18 decimals
      expect(await coins.balanceOf(addr1.address)).to.equal(expectedAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        coins.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWithCustomError(coins, "OwnableUnauthorizedAccount");
    });
  });

  describe("Whitelist", function () {
    it("Should allow owner to whitelist addresses", async function () {
      await coins.setWhitelisted(addr1.address, true);
      // Mint some tokens to test transfer
      await coins.mint(addr1.address, 100);
      // Should not revert
      await expect(coins.connect(addr1).transfer(addr2.address, 100)).to.not.be
        .reverted;
    });

    it("Should not allow non-owner to whitelist addresses", async function () {
      await expect(
        coins.connect(addr1).setWhitelisted(addr2.address, true)
      ).to.be.revertedWith("Only the owner can modify the whitelist");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      // Mint some tokens to addr1
      await coins.mint(addr1.address, 100);
    });

    it("Should not allow transfer from non-whitelisted address", async function () {
      await expect(
        coins.connect(addr1).transfer(addr2.address, 100)
      ).to.be.revertedWith("Only whitelisted addresses can initiate transfers");
    });

    it("Should allow transfer from whitelisted address", async function () {
      // Whitelist addr1
      await coins.setWhitelisted(addr1.address, true);

      const transferAmount = BigInt(100) * BigInt(10 ** 18);
      await expect(coins.connect(addr1).transfer(addr2.address, transferAmount))
        .to.emit(coins, "Transfer")
        .withArgs(addr1.address, addr2.address, transferAmount);

      expect(await coins.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should handle transferFrom correctly", async function () {
      // Whitelist addr1
      await coins.setWhitelisted(addr1.address, true);
      const transferAmount = BigInt(50) * BigInt(10 ** 18);

      // Approve addr2 to spend addr1's tokens
      await coins.connect(addr1).approve(addr2.address, transferAmount);

      await expect(
        coins
          .connect(addr2)
          .transferFrom(addr1.address, addr2.address, transferAmount)
      )
        .to.emit(coins, "Transfer")
        .withArgs(addr1.address, addr2.address, transferAmount);
    });
  });

  describe("Burning", function () {
    it("Should allow token burning", async function () {
      const mintAmount = BigInt(100) * BigInt(10 ** 18);
      await coins.mint(addr1.address, 100);
      await coins.setWhitelisted(addr1.address, true);

      await expect(coins.connect(addr1).burn(mintAmount))
        .to.emit(coins, "Transfer")
        .withArgs(addr1.address, ethers.ZeroAddress, mintAmount);

      expect(await coins.balanceOf(addr1.address)).to.equal(0);
    });
  });
});
