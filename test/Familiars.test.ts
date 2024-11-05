import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Familiars } from "../typechain-types";

describe("Familiars", function () {
  let familiars: Familiars;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  // Constants for testing
  const TOKEN_URI = "ipfs://QmTest";
  const INITIAL_HEALTH = 50;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    const FamiliarsFactory = await ethers.getContractFactory("Familiars");
    familiars = await FamiliarsFactory.deploy();
    await familiars.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await familiars.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await familiars.name()).to.equal("Familiars");
      expect(await familiars.symbol()).to.equal("FMLRS");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await familiars.safeMint(addr1.address, TOKEN_URI);
      expect(await familiars.ownerOf(1)).to.equal(addr1.address);
      expect(await familiars.tokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        familiars.connect(addr1).safeMint(addr2.address, TOKEN_URI)
      ).to.be.revertedWithCustomError(familiars, "OwnableUnauthorizedAccount");
    });

    it("Should set initial location to HOME", async function () {
      await familiars.safeMint(addr1.address, TOKEN_URI);
      expect(await familiars.getCurrentLocation(1)).to.equal("Home");
    });
  });

  describe("Health Management", function () {
    beforeEach(async function () {
      await familiars.safeMint(addr1.address, TOKEN_URI);
    });

    it("Should allow owner to set health", async function () {
      await familiars.setHealth(1, INITIAL_HEALTH);
      expect(await familiars.getHealth(1)).to.equal(INITIAL_HEALTH);
    });

    it("Should emit SetHealth event", async function () {
      await expect(familiars.setHealth(1, INITIAL_HEALTH))
        .to.emit(familiars, "SetHealth")
        .withArgs(1, INITIAL_HEALTH);
    });

    it("Should not allow health above 50", async function () {
      await expect(familiars.setHealth(1, 51)).to.be.revertedWith(
        "Health out of range"
      );
    });

    it("Should not allow health of 1", async function () {
      await expect(familiars.setHealth(1, 0)).to.be.revertedWith(
        "Health out of range"
      );
    });
  });

  describe("Location Management", function () {
    beforeEach(async function () {
      await familiars.safeMint(addr1.address, TOKEN_URI);
    });

    it("Should allow owner to change location", async function () {
      await familiars.goToLocation(1, 1); // KARMIC_TOWER
      expect(await familiars.getCurrentLocation(1)).to.equal("Karmic Tower");
    });

    it("Should emit GoToLocation event", async function () {
      await expect(familiars.goToLocation(1, 1))
        .to.emit(familiars, "GoToLocation")
        .withArgs(1, "Karmic Tower");
    });

    it("Should not allow non-owner to change location", async function () {
      await expect(
        familiars.connect(addr1).goToLocation(1, 1)
      ).to.be.revertedWithCustomError(familiars, "OwnableUnauthorizedAccount");
    });

    it("Should handle all location types correctly", async function () {
      const locationTests = [
        { enum: 0, name: "Karmic Wellspring" },
        { enum: 1, name: "Karmic Tower" },
        { enum: 2, name: "Home" },
        { enum: 3, name: "Gathering Area" },
      ];

      for (const loc of locationTests) {
        await familiars.goToLocation(1, loc.enum);
        expect(await familiars.getCurrentLocation(1)).to.equal(loc.name);
      }
    });
  });

  describe("Token Validation", function () {
    it("Should revert operations for non-existent tokens", async function () {
      await expect(familiars.getHealth(999)).to.be.revertedWith(
        "Token does not exist"
      );
      await expect(familiars.getCurrentLocation(999)).to.be.revertedWith(
        "Token does not exist"
      );
      await expect(familiars.setHealth(999, INITIAL_HEALTH)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });
});
