import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Familiars } from "../typechain-types";

describe("Familiars Contract", function () {
  let familiars: Familiars;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  enum Location {
    KARMIC_WELLSPRING,
    KARMIC_TOWER,
    HOME,
    GATHERING_AREA,
  }

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

    await familiars.setOperator(addr1.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await familiars.owner()).to.equal(owner.address);
    });

    it("Should set the right operator", async function () {
      expect(await familiars.operator()).to.equal(addr1.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await familiars.name()).to.equal("Familiars");
      expect(await familiars.symbol()).to.equal("FMLRS");
    });
  });

  describe("Minting", function () {
    it("Should allow operator to mint tokens", async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
      expect(await familiars.connect(addr1).ownerOf(1)).to.equal(addr1.address);
      expect(await familiars.connect(addr1).tokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should not allow non-operator to mint tokens", async function () {
      await expect(
        familiars.connect(addr2).safeMint(addr2.address, TOKEN_URI)
      ).to.be.rejectedWith("Caller is not the operator");
    });

    it("Should set initial location to HOME", async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
      expect(await familiars.getCurrentLocation(1)).to.equal("Home");
    });
  });

  describe("Health Management", function () {
    beforeEach(async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
    });

    it("Should allow owner to set health", async function () {
      await familiars.connect(addr1).setHealth(1, INITIAL_HEALTH);
      expect(await familiars.connect(addr1).getHealth(1)).to.equal(
        INITIAL_HEALTH
      );
    });

    it("Should emit SetHealth event", async function () {
      await expect(familiars.connect(addr1).setHealth(1, INITIAL_HEALTH))
        .to.emit(familiars, "SetHealth")
        .withArgs(1, INITIAL_HEALTH);
    });

    it("Should not allow health above 50", async function () {
      await expect(
        familiars.connect(addr1).setHealth(1, 51)
      ).to.be.revertedWith("Health out of range");
    });

    it("Should not allow health of 1", async function () {
      await expect(familiars.connect(addr1).setHealth(1, 0)).to.be.revertedWith(
        "Health out of range"
      );
    });
  });

  describe("Location Management", function () {
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
    beforeEach(async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
    });

    it("Should allow operator to change location", async function () {
      await familiars.connect(addr1).goToLocation(1, 1); // KARMIC_TOWER
      expect(await familiars.connect(addr1).getCurrentLocation(1)).to.equal(
        "Karmic Tower"
      );
    });

    it("Should emit GoToLocation event", async function () {
      await expect(familiars.connect(addr1).goToLocation(1, 1))
        .to.emit(familiars, "GoToLocation")
        .withArgs(1, "Karmic Tower");
    });

    it("Should not allow non-operator to change location", async function () {
      await expect(
        familiars.connect(addr2).goToLocation(1, 1)
      ).to.be.revertedWith("Caller is not the operator");
    });

    it("Should allow operator to set requirements", async function () {
      await familiars
        .connect(addr1)
        .setLocationRequirements(Location.GATHERING_AREA, req);

      const result = await familiars
        .connect(addr1)
        .locationRequirements(Location.GATHERING_AREA);

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

    it("Should not allow non-operator to set requirements", async function () {
      await expect(
        familiars
          .connect(addr2)
          .setLocationRequirements(Location.GATHERING_AREA, req)
      ).to.be.revertedWith("Caller is not the operator");
    });

    it("Should handle all location types correctly", async function () {
      const locationTests = [
        { enum: 0, name: "Karmic Wellspring" },
        { enum: 1, name: "Karmic Tower" },
        { enum: 2, name: "Home" },
        { enum: 3, name: "Gathering Area" },
      ];

      for (const loc of locationTests) {
        await familiars.connect(addr1).goToLocation(1, loc.enum);
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
      await expect(
        familiars.connect(addr1).setHealth(999, INITIAL_HEALTH)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Set Operator", function () {
    it("Should allow owner to set operator", async function () {
      await familiars.setOperator(addr2.address);
      // Should not revert
      expect(await familiars.operator()).to.equal(addr2.address);
    });

    it("Should not allow non-owner to set operator", async function () {
      await expect(
        familiars.connect(addr2).setOperator(addr2.address)
      ).to.be.revertedWithCustomError(familiars, "OwnableUnauthorizedAccount");
    });
  });
});
