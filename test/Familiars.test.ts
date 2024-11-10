import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Familiars, FamiliarsItem as FamiliarsItems } from "../typechain-types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Familiars Contract", function () {
  let familiars: Familiars;
  let familiarItems: FamiliarsItems;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let tba: SignerWithAddress;

  enum Location {
    KARMIC_WELLSPRING,
    KARMIC_TOWER,
    HOME,
    GATHERING_AREA,
    MARKETPLACE,
  }

  // Constants for testing
  const TOKEN_URI = "ipfs://QmTest";
  const INITIAL_HEALTH = 100;
  const HEAD_ITEM_ID = 1;
  const MOUTH_ITEM_ID = 2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, tba] = await ethers.getSigners();

    // Deploy the contracts
    const FamiliarsFactory = await ethers.getContractFactory("Familiars");
    familiars = await FamiliarsFactory.deploy();
    await familiars.waitForDeployment();

    const FamiliarsItemsFactory = await ethers.getContractFactory(
      "FamiliarsItem"
    );
    familiarItems = await FamiliarsItemsFactory.deploy();
    await familiarItems.waitForDeployment();

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
      expect(await familiars.ownerOf(1)).to.equal(addr1.address);
      expect(await familiars.tokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should not allow non-operator to mint tokens", async function () {
      await expect(
        familiars.connect(addr2).safeMint(addr2.address, TOKEN_URI)
      ).to.be.revertedWith("Caller is not the operator");
    });

    it("Should set initial location to HOME", async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);

      // Destructure the return values
      const [locationString, locationEnum] = await familiars.getCurrentLocation(
        1
      );

      // Check both values separately
      expect(locationString).to.equal("Home");
      expect(locationEnum).to.equal(2); // Assuming 2 is the enum value for HOME
    });

    // Alternative approach using deep equality
    it("Should set initial location to HOME", async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);

      // Using deep equality to compare the entire tuple
      expect(await familiars.getCurrentLocation(1)).to.deep.equal(["Home", 2]);
    });

    it("Should set initial health to 100", async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
      expect(await familiars.getHealth(1)).to.equal(100);
    });

    it("Should increment token IDs correctly", async function () {
      await familiars.connect(addr1).safeMint(addr2.address, TOKEN_URI);
      await familiars.connect(addr1).safeMint(addr2.address, TOKEN_URI);
      await familiars.connect(addr1).safeMint(addr2.address, TOKEN_URI);
      await familiars.connect(addr1).safeMint(addr2.address, TOKEN_URI);
      await familiars.connect(addr1).safeMint(addr2.address, TOKEN_URI);

      expect(await familiars.latestTokenId()).to.equal(5);
    });
  });

  describe("Health Management", function () {
    beforeEach(async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
    });

    it("Should allow operator to set health", async function () {
      await familiars.connect(addr1).setHealth(1, 50);
      expect(await familiars.getHealth(1)).to.equal(50);
    });

    it("Should emit SetHealth event", async function () {
      await expect(familiars.connect(addr1).setHealth(1, 50))
        .to.emit(familiars, "SetHealth")
        .withArgs(1, 50);
    });

    it("Should not allow health above 100", async function () {
      await expect(
        familiars.connect(addr1).setHealth(1, 101)
      ).to.be.revertedWith("Health out of range");
    });

    it("Should not allow health of 0", async function () {
      await expect(familiars.connect(addr1).setHealth(1, 0)).to.be.revertedWith(
        "Health out of range"
      );
    });

    it("Should not allow non-operator to set health", async function () {
      await expect(
        familiars.connect(addr2).setHealth(1, 50)
      ).to.be.revertedWith("Caller is not the operator");
    });
  });

  describe("Location Management", function () {
    const requirements = {
      minHealth: 50,
      healthCost: 10,
      minKarmicEnergy: 20,
      karmicEnergyCost: 5,
      minFood: 30,
      foodCost: 8,
      minCoin: 40,
      coinCost: 15,
      getCoin: 5,
      getHealth: 3,
      getKarmicEnergy: 4,
      getFood: 2,
    };

    beforeEach(async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
    });

    it("Should allow operator to change location", async function () {
      await familiars.connect(addr1).goToLocation(1, Location.KARMIC_TOWER);
      expect(await familiars.getCurrentLocation(1)).to.deep.equal([
        "Karmic Tower",
        1,
      ]);
    });

    it("Should emit GoToLocation event", async function () {
      await expect(
        familiars.connect(addr1).goToLocation(1, Location.KARMIC_TOWER)
      )
        .to.emit(familiars, "GoToLocation")
        .withArgs(1, "Karmic Tower");
    });

    it("Should not allow non-operator to change location", async function () {
      await expect(
        familiars.connect(addr2).goToLocation(1, Location.KARMIC_TOWER)
      ).to.be.revertedWith("Caller is not the operator");
    });

    it("Should handle all location types correctly", async function () {
      const locationTests = [
        { enum: Location.KARMIC_WELLSPRING, name: "Karmic Wellspring" },
        { enum: Location.HOME, name: "Home" },
        { enum: Location.KARMIC_TOWER, name: "Karmic Tower" },
        { enum: Location.GATHERING_AREA, name: "Gathering Area" },
        { enum: Location.MARKETPLACE, name: "Marketplace" },
      ];

      for (const loc of locationTests) {
        await familiars.connect(addr1).goToLocation(1, loc.enum);
        // Compare with the actual enum value instead of 0
        expect(await familiars.getCurrentLocation(1)).to.deep.equal([
          loc.name,
          loc.enum,
        ]);
      }
    });

    it("Should allow setting and retrieving location requirements", async function () {
      await familiars
        .connect(owner)
        .setLocationRequirements(Location.MARKETPLACE, requirements);
      const reqs = await familiars.getLocationRequirements(
        Location.MARKETPLACE
      );

      expect(reqs.minHealth).to.equal(requirements.minHealth);
      expect(reqs.healthCost).to.equal(requirements.healthCost);
      expect(reqs.minKarmicEnergy).to.equal(requirements.minKarmicEnergy);
      expect(reqs.karmicEnergyCost).to.equal(requirements.karmicEnergyCost);
      expect(reqs.minFood).to.equal(requirements.minFood);
      expect(reqs.foodCost).to.equal(requirements.foodCost);
      expect(reqs.minCoin).to.equal(requirements.minCoin);
      expect(reqs.coinCost).to.equal(requirements.coinCost);
      expect(reqs.getCoin).to.equal(requirements.getCoin);
      expect(reqs.getHealth).to.equal(requirements.getHealth);
      expect(reqs.getKarmicEnergy).to.equal(requirements.getKarmicEnergy);
      expect(reqs.getFood).to.equal(requirements.getFood);
    });
  });

  describe("Equippable Items", function () {
    const itemStats = {
      healthIncrease: 12,
      healthDecrease: 0,
      karmicIncrease: 0,
      karmicDecrease: 0,
      foodIncrease: 0,
      foodDecrease: 0,
      coinIncrease: 0,
      coinDecrease: 0,
      luckIncrease: 0,
      luckDecrease: 0,
    };
    beforeEach(async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
      await familiarItems
        .connect(owner)
        .mint(tba.address, HEAD_ITEM_ID, 1, itemStats);
      await familiarItems
        .connect(owner)
        .mint(tba.address, MOUTH_ITEM_ID, 1, itemStats);
    });

    it("Should allow operator to equip items", async function () {
      await familiars
        .connect(addr1)
        .equipItem(
          1,
          MOUTH_ITEM_ID,
          HEAD_ITEM_ID,
          tba.address,
          await familiarItems.getAddress()
        );

      const equipped = await familiars.getEquippedItems(1);
      expect(equipped.head).to.equal(HEAD_ITEM_ID);
      expect(equipped.mouth).to.equal(MOUTH_ITEM_ID);
    });

    it("Should not allow equipping same item to head and mouth", async function () {
      await expect(
        familiars
          .connect(addr1)
          .equipItem(
            1,
            HEAD_ITEM_ID,
            HEAD_ITEM_ID,
            tba.address,
            await familiarItems.getAddress()
          )
      ).to.be.revertedWith("Mouth and head equippable nft should not equal.");
    });

    it("Should handle equipping when TBA has no items", async function () {
      await familiars
        .connect(addr1)
        .equipItem(1, 999, 888, tba.address, await familiarItems.getAddress());

      const equipped = await familiars.getEquippedItems(1);
      expect(equipped.head).to.equal(0);
      expect(equipped.mouth).to.equal(0);
    });

    it("Should allow partial equipping", async function () {
      await familiars
        .connect(addr1)
        .equipItem(
          1,
          MOUTH_ITEM_ID,
          0,
          tba.address,
          await familiarItems.getAddress()
        );

      const equipped = await familiars.getEquippedItems(1);
      expect(equipped.head).to.equal(0);
      expect(equipped.mouth).to.equal(MOUTH_ITEM_ID);
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
        familiars.connect(addr1).setHealth(999, 50)
      ).to.be.revertedWith("Token does not exist");

      await expect(familiars.getEquippedItems(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });

  describe("Operator Management", function () {
    it("Should allow owner to set operator", async function () {
      await familiars.connect(owner).setOperator(addr2.address);
      expect(await familiars.operator()).to.equal(addr2.address);
    });

    it("Should emit SetNewOperator event", async function () {
      await expect(familiars.connect(owner).setOperator(addr2.address))
        .to.emit(familiars, "SetNewOperator")
        .withArgs(addr2.address);
    });

    it("Should not allow non-owner to set operator", async function () {
      await expect(
        familiars.connect(addr2).setOperator(addr2.address)
      ).to.be.revertedWithCustomError(familiars, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token URI Management", function () {
    it("Should return correct token URI", async function () {
      await familiars.connect(addr1).safeMint(addr1.address, TOKEN_URI);
      expect(await familiars.tokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should revert for non-existent token URI", async function () {
      await expect(familiars.tokenURI(999)).to.be.reverted;
    });
  });
});
