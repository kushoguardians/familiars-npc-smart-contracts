import { expect } from "chai";
import { ethers } from "hardhat";
import { Food } from "../typechain-types";

describe("Food Contract", function () {
  let food: Food;
  let owner: any, addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const FoodFactory = await ethers.getContractFactory("Food");
    food = (await FoodFactory.deploy()) as Food;
    await food.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await food.owner()).to.equal(owner.address);
    });

    it("Should have the correct initial URI", async function () {
      expect(await food.uri(0)).to.equal(
        "ipfs://QmUE1hMRA85uaaoYAotPxXzAfVUy4hsMHyyjPXvayQQWHB"
      );
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint tokens", async function () {
      try {
        await food.mint(addr1.address, 100);
        expect(await food.balanceOf(addr1.address, 0)).to.equal(100);
      } catch (error) {
        console.error("Error in owner minting test:", error);
        throw error; // Re-throw the error to ensure the test fails
      }
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        food.connect(addr1).mint(addr1.address, 100)
      ).to.be.revertedWithCustomError(food, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow the owner to burn tokens", async function () {
      await food.mint(addr1.address, 100);

      // Approve the contract to burn tokens on behalf of addr1
      await food.connect(addr1).setApprovalForAll(owner.address, true);

      await food.burn(addr1.address, 0, 50);
      expect(await food.balanceOf(addr1.address, 0)).to.equal(50);
    });

    it("Should not allow non-owner to burn tokens", async function () {
      await food.mint(addr1.address, 100);

      // Ensure addr1 does not approve the owner to burn tokens
      await expect(
        food.connect(addr1).burn(addr1.address, 0, 50)
      ).to.be.revertedWithCustomError(food, "OwnableUnauthorizedAccount");
    });
  });

  describe("URI Management", function () {
    it("Should allow the owner to set a new URI", async function () {
      const newUri = "ipfs://newUri";
      await food.setURI(newUri);
      expect(await food.uri(0)).to.equal(newUri);
    });

    it("Should not allow non-owner to set a new URI", async function () {
      const newUri = "ipfs://newUri";
      await expect(
        food.connect(addr1).setURI(newUri)
      ).to.be.revertedWithCustomError(food, "OwnableUnauthorizedAccount");
    });
  });
});
