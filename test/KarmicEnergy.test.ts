import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { KarmicEnergy } from "../typechain-types";

describe("KarmicEnergy Contract", function () {
  let karmicEnergy: KarmicEnergy;
  let owner: SignerWithAddress, addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const KarmicEnergyFactory = await ethers.getContractFactory("KarmicEnergy");
    karmicEnergy = (await KarmicEnergyFactory.deploy()) as KarmicEnergy;
    await karmicEnergy.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await karmicEnergy.owner()).to.equal(owner.address);
    });

    it("Should have the correct initial URI", async function () {
      expect(await karmicEnergy.uri(0)).to.equal(
        "ipfs://QmUE1hMRA85uaaoYAotPxXzAfVUy4hsMHyyjPXvayQQWHB"
      );
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint tokens", async function () {
      try {
        await karmicEnergy.mint(addr1.address, 100);
        expect(await karmicEnergy.balanceOf(addr1.address, 0)).to.equal(100);
      } catch (error) {
        console.error("Error in owner minting test:", error);
        throw error; // Re-throw the error to ensure the test fails
      }
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        karmicEnergy.connect(addr1).mint(addr1.address, 100)
      ).to.be.revertedWithCustomError(
        karmicEnergy,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Burning", function () {
    it("Should allow the owner to burn tokens", async function () {
      await karmicEnergy.mint(addr1.address, 100);

      // Approve the contract to burn tokens on behalf of addr1
      await karmicEnergy.connect(addr1).setApprovalForAll(owner.address, true);

      await karmicEnergy.burn(addr1.address, 0, 50);
      expect(await karmicEnergy.balanceOf(addr1.address, 0)).to.equal(50);
    });

    it("Should not allow non-owner to burn tokens", async function () {
      await karmicEnergy.mint(addr1.address, 100);

      // Ensure addr1 does not approve the owner to burn tokens
      await expect(
        karmicEnergy.connect(addr1).burn(addr1.address, 0, 50)
      ).to.be.revertedWithCustomError(
        karmicEnergy,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("URI Management", function () {
    it("Should allow the owner to set a new URI", async function () {
      const newUri = "ipfs://newUri";
      await karmicEnergy.setURI(newUri);
      expect(await karmicEnergy.uri(0)).to.equal(newUri);
    });

    it("Should not allow non-owner to set a new URI", async function () {
      const newUri = "ipfs://newUri";
      await expect(
        karmicEnergy.connect(addr1).setURI(newUri)
      ).to.be.revertedWithCustomError(
        karmicEnergy,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
