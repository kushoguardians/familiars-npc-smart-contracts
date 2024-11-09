import { expect } from "chai";
import { ethers } from "hardhat";
import { KarmicEnergy } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("KarmicEnergy Contract", function () {
  let karmicEnergy: KarmicEnergy;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const KarmicEnergyFactory = await ethers.getContractFactory("KarmicEnergy");
    karmicEnergy = (await KarmicEnergyFactory.deploy()) as KarmicEnergy;
    await karmicEnergy.waitForDeployment();

    await karmicEnergy.setOperator(addr1.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await karmicEnergy.owner()).to.equal(owner.address);
    });
    it("Should set the right operator", async function () {
      expect(await karmicEnergy.operator()).to.equal(await addr1.getAddress());
    });
    it("Should have the correct initial URI", async function () {
      expect(await karmicEnergy.uri(0)).to.equal(
        "ipfs://QmUE1hMRA85uaaoYAotPxXzAfVUy4hsMHyyjPXvayQQWHB"
      );
    });
  });

  describe("Minting", function () {
    it("Should allow the operator to mint tokens", async function () {
      await karmicEnergy.connect(addr1).mint(addr1.address, 100);
      expect(await karmicEnergy.balanceOf(addr1.address, 0)).to.equal(100);
    });

    it("Should not allow non-operator to mint tokens", async function () {
      await expect(karmicEnergy.connect(addr2).mint(addr1.address, 100)).to.be
        .reverted;
    });
  });

  describe("Burning", function () {
    it("Should allow the operator to burn tokens", async function () {
      await karmicEnergy.connect(addr1).mint(addr1.address, 100);

      // Approve the contract to burn tokens on behalf of addr1
      await karmicEnergy.setApprovalForAll(addr1.address, true);

      await karmicEnergy.connect(addr1).burn(addr1.address, 0, 50);
      expect(await karmicEnergy.balanceOf(addr1.address, 0)).to.equal(50);
    });

    it("Should not allow non-operator to burn tokens", async function () {
      await karmicEnergy.connect(addr1).mint(addr1.address, 100);

      // Ensure addr2 does not approve the operator to burn tokens
      await expect(
        karmicEnergy.connect(addr2).burn(addr1.address, 0, 50)
      ).to.be.rejectedWith("Caller is not the operator");
    });
  });

  describe("URI Management", function () {
    it("Should allow the operator to set a new URI", async function () {
      const newUri = "ipfs://newUri";
      await karmicEnergy.connect(addr1).setURI(newUri);
      expect(await karmicEnergy.uri(0)).to.equal(newUri);
    });

    it("Should not allow non-operator to set a new URI", async function () {
      const newUri = "ipfs://newUri";
      await expect(karmicEnergy.connect(addr2).setURI(newUri)).to.be.reverted;
    });
  });
  describe("Set Operator", function () {
    it("Should allow owner to set operator", async function () {
      await karmicEnergy.setOperator(addr2.address);
      // Should not revert
      expect(await karmicEnergy.operator()).to.equal(addr2.address);
    });

    it("Should not allow non-owner to set operator", async function () {
      await expect(
        karmicEnergy.connect(addr2).setOperator(addr2.address)
      ).to.be.revertedWithCustomError(
        karmicEnergy,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
