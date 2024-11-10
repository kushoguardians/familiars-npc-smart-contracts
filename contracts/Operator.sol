// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Import required OpenZeppelin contracts for standard implementations
import "@openzeppelin/contracts/access/Ownable.sol"; // Provides basic access control
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Familiars.sol";
import "./FamiliarsLib.sol";
import "./Coins.sol";
import "./KarmicEnergy.sol";
import "./Food.sol";
import "./FamiliarsItem.sol";
import "./Marketplace.sol";
import "./ERC6551Registry.sol";
import "./KarmicWellSpring.sol";

/**
 * @title Operator
 * @dev Contract managing interactions between Familiars and various game resources
 * @notice Handles location changes and resource management for the game
 */
contract Operator is Ownable, Pausable {
    address TBA_REGISTRY;
    address TBA_IMPL;
    uint256 constant CHAINID = 84532;
    // Contract instances for different game components
    Familiars public familiars; // Contract managing Familiar NFTs
    Coins public coins; // Contract managing in-game currency
    KarmicEnergy public karmicEnergy; // Contract managing Karmic Energy resource
    Food public food; // Contract managing Food resource
    FamiliarsItem public familiarsItem; // Contract of familiar items equippable
    Marketplace public marketplace;
    KarmicWellSpring public karmicWellSpring;

    // Address authorized to verify certain operations
    address verifier;

    // Nonce for signing
    uint256 public nonce;

    // Constant used to identify resource tokens across different contracts
    uint256 private constant RESOURCE_TOKEN_ID = 0;

    /**
     * @dev Constructor initializes the Operator with necessary contract addresses
     * @param _familiars Address of the Familiars contract
     * @param _food Address of the Food contract
     * @param _coins Address of the Coins contract
     * @param _karmicEnergy Address of the KarmicEnergy contract
     */
    constructor(
        address _familiars,
        address _food,
        address _coins,
        address _karmicEnergy,
        address _familiarsItem,
        address _marketplace,
        address _karmicWellSpring,
        address _tbaRegistry,
        address _tbaAccountImpl
    ) Ownable(_msgSender()) {
        verifier = _msgSender();
        familiars = Familiars(_familiars);
        food = Food(_food);
        coins = Coins(_coins);
        karmicEnergy = KarmicEnergy(_karmicEnergy);
        familiarsItem = FamiliarsItem(_familiarsItem);
        marketplace = Marketplace(_marketplace);
        karmicWellSpring = KarmicWellSpring(_karmicWellSpring);
        TBA_REGISTRY = _tbaRegistry;
        TBA_IMPL = _tbaAccountImpl;
        nonce = 1;
    }

    modifier validSig(bytes calldata _signature) {
        address signer = FamiliarsLib.getVerifier(
            nonce,
            CHAINID,
            _msgSender(),
            _signature
        );
        require(signer == verifier, "Invalid signature");
        _;
    }

    /**
     * @dev Creates a new NPC (Non-Player Character) Familiar
     * @param _to Address to receive the NPC
     * @param _uri Metadata URI for the NPC
     * @param _signature The signature of the verifier
     * @param _initData The initial data
     */
    function createNPC(
        address _to,
        string memory _uri,
        bytes calldata _signature,
        bytes calldata _initData
    ) external whenNotPaused validSig(_signature) {
        uint256 _tokenId = familiars.safeMint(_to, _uri);
        _createTba(_tokenId, _initData);
        nonce += 1;
    }

    /**
     * @dev Moves a Familiar to a new location after checking requirements
     * @param _tokenId The ID of the Familiar
     * @param _location The destination location
     * @param _signature The signature of the verifier
     */
    function goToLocation(
        uint256 _tokenId,
        FamiliarsLib.Location _location,
        bytes calldata _signature
    ) external whenNotPaused validSig(_signature) {
        address _tba = _getTba(_tokenId);
        require(_tba != address(0), "Token not bound to address");
        _reqChecker(_tokenId, _tba, _location);
        familiars.goToLocation(_tokenId, _location);
        nonce += 1;
    }

    /**
     * @dev Retrieves the stats of a Non-Player Character (NPC) associated with a given token ID.
     * @param tokenId The token ID for which to retrieve NPC stats.
     * @return A tuple containing the NPC's health, current location, coin balance, karmic energy balance,
     *         food balance, and equipped items.
     */
    function getNPCStats(
        uint256 tokenId
    )
        external
        view
        returns (
            uint8, // Health of the NPC
            string memory, // Current location of the NPC
            uint256, // Coin balance of the NPC
            uint256, // Karmic energy balance of the NPC
            uint256, // Food balance of the NPC
            FamiliarsLib.EquipItems memory // Equipped items of the NPC
        )
    {
        // Retrieve the address associated with the given tokenId
        address tba = _getTba(tokenId);
        require(tba != address(0), "Token not bound to address");

        // Retrieve the equipped items for the NPC using the tokenId
        FamiliarsLib.EquipItems memory _equippedItems = familiars
            .getEquippedItems(tokenId);

        // Retrieve the health of the NPC using the tokenId
        uint8 health = familiars.getHealth(tokenId);

        // Retrieve the coin balance of the NPC from the coins contract
        uint256 _coins = coins.balanceOf(tba);

        // Retrieve the karmic energy balance of the NPC from the karmicEnergy contract
        uint256 _karmic = karmicEnergy.balanceOf(tba, RESOURCE_TOKEN_ID);

        // Retrieve the food balance of the NPC from the food contract
        uint256 _food = food.balanceOf(tba, RESOURCE_TOKEN_ID);

        // Retrieve the current location of the NPC using the tokenId
        (string memory location, ) = familiars.getCurrentLocation(tokenId);

        // Return the NPC's stats as a tuple
        return (health, location, _coins, _karmic, _food, _equippedItems);
    }

    /**
     * @dev Gets the current location requirements
     * @return _requirements The requirements for the location
     */
    function getLocationRequirements(
        FamiliarsLib.Location _location
    ) external view returns (FamiliarsLib.Requirements memory) {
        FamiliarsLib.Requirements memory _requirements = familiars
            .getLocationRequirements(_location);
        return _requirements;
    }

    /**
     * @dev Equips items (mouth and/or head) to a specific token
     * @param _tokenId The ID of the token to equip items to
     * @param _mouthTokenId The ID of the mouth item to equip (0 if none)
     * @param _headTokenId The ID of the head item to equip (0 if none)
     * @param _signature The signature of the verifier
     */
    function equipItem(
        uint256 _tokenId,
        uint256 _mouthTokenId,
        uint256 _headTokenId,
        bytes calldata _signature
    ) external whenNotPaused validSig(_signature) {
        address tba = _getTba(_tokenId);
        require(tba != address(0), "Token not bound to address");
        familiars.equipItem(
            _tokenId,
            _mouthTokenId,
            _headTokenId,
            tba,
            address(familiarsItem)
        );
        nonce += 1;
    }

    /**
     * @dev Exchanges Karmic Energy for a specific token
     * @param _tokenId The ID of the token to exchange energy for
     * @param _karmicEnergyAmt The amount of Karmic Energy to exchange
     * @param _signature The signature of the verifier
     */
    function exchangeKarmicEnergy(
        uint256 _tokenId,
        uint256 _karmicEnergyAmt,
        bytes calldata _signature
    ) external whenNotPaused validSig(_signature) {
        address tba = _getTba(_tokenId);
        require(tba != address(0), "Token not bound to address");
        (, FamiliarsLib.Location loc) = familiars.getCurrentLocation(_tokenId);
        require(
            loc == FamiliarsLib.Location.KARMIC_WELLSPRING,
            "NPC location should be on Karmic Wellspring"
        );
        karmicWellSpring.exchangeKarmicEnergy(_karmicEnergyAmt, tba);
        nonce += 1;
    }

    /**
     * @dev Exchanges coins for food
     * @param _tokenId The ID of the token to exchange energy for
     * @param _coinsAmt The amount of coins to exchange
     * @param _signature The signature of the verifier
     */
    function buyFoodToMarketplace(
        uint256 _tokenId,
        uint256 _coinsAmt,
        bytes calldata _signature
    ) external whenNotPaused validSig(_signature) {
        address tba = _getTba(_tokenId);
        require(tba != address(0), "Token not bound to address");
        (, FamiliarsLib.Location loc) = familiars.getCurrentLocation(_tokenId);
        require(
            loc == FamiliarsLib.Location.MARKET_PLACE,
            "NPC location should be on marketplace"
        );
        marketplace.exchangeCoinsToFood(_coinsAmt, tba);
        nonce += 1;
    }

    /**
     * @dev Exchanges coins to tresurebox
     * @param _tokenId The ID of the token to exchange energy for
     * @param _signature The signature of the verifier
     */
    function buyTreasureBox(
        uint256 _tokenId,
        bytes calldata _signature
    ) external whenNotPaused validSig(_signature) {
        address tba = _getTba(_tokenId);
        require(tba != address(0), "Token not bound to address");
        (, FamiliarsLib.Location loc) = familiars.getCurrentLocation(_tokenId);
        require(
            loc == FamiliarsLib.Location.MARKET_PLACE,
            "NPC location should be on marketplace"
        );
        marketplace.buyTreasureBox(tba);
        nonce += 1;
    }

    /**
     * @dev Main function that checks requirements and processes resource changes
     * @param _tokenId The ID of the Familiar
     * @param _tba Token Bound Account address
     */
    function _reqChecker(
        uint256 _tokenId,
        address _tba,
        FamiliarsLib.Location _location
    ) internal {
        // Split processing into two main parts for better organization
        _checkAndUpdateEquipment(_tokenId, _tba);
        _processResourceChanges(_tokenId, _tba, _location);
    }

    /**
     * @dev Checks and updates equipment status for a Familiar
     * @param _tokenId The ID of the Familiar
     * @param _tba Token Bound Account address
     */
    function _checkAndUpdateEquipment(uint256 _tokenId, address _tba) private {
        // Get currently equipped items
        FamiliarsLib.EquipItems memory equipped = familiars.getEquippedItems(
            _tokenId
        );
        bool needsUpdate = false;
        FamiliarsLib.EquipItems memory newEquippedItems = FamiliarsLib
            .EquipItems({mouth: 0, head: 0});

        // Check if head item is still owned by the account
        if (equipped.head != 0) {
            if (familiarsItem.balanceOf(_tba, equipped.head) > 0) {
                newEquippedItems.head = equipped.head;
            } else {
                needsUpdate = true;
            }
        }

        // Check if mouth item is still owned by the account
        if (equipped.mouth != 0) {
            if (familiarsItem.balanceOf(_tba, equipped.mouth) > 0) {
                newEquippedItems.mouth = equipped.mouth;
            } else {
                needsUpdate = true;
            }
        }

        // Update equipment if items were removed
        if (needsUpdate) {
            familiars.equipItem(
                _tokenId,
                newEquippedItems.mouth,
                newEquippedItems.head,
                _tba,
                address(familiarsItem)
            );
        }
    }

    /**
     * @dev Processes all resource changes for a Familiar
     * @param _tokenId The ID of the Familiar
     * @param _tba Token Bound Account address
     */
    function _processResourceChanges(
        uint256 _tokenId,
        address _tba,
        FamiliarsLib.Location _location
    ) private {
        // Get location requirements
        FamiliarsLib.Requirements memory req = familiars
            .getLocationRequirements(_location);
        // Get current balances of all resources
        uint256 currentHealth = familiars.getHealth(_tokenId);
        uint256 currentKarmicEnergy = karmicEnergy.balanceOf(
            _tba,
            RESOURCE_TOKEN_ID
        );

        uint256 currentFood = food.balanceOf(_tba, RESOURCE_TOKEN_ID);
        uint256 currentCoins = coins.balanceOf(_tba);
        // Verify all requirements are met
        FamiliarsLib.checkRequirements(
            currentHealth,
            currentCoins,
            currentFood,
            currentKarmicEnergy,
            req
        );

        // Get attributes of equipped items
        (
            FamiliarsLib.ItemAttributes memory headAttr,
            FamiliarsLib.ItemAttributes memory mouthAttr
        ) = _getEquippedItemAttributes(_tokenId);

        // Process changes for each resource type
        _processHealthChanges(
            _tokenId,
            currentHealth,
            req,
            headAttr,
            mouthAttr
        );
        _processKarmicEnergyChanges(_tba, req, headAttr, mouthAttr);
        _processFoodChanges(_tba, req, headAttr, mouthAttr);
        _processCoinChanges(_tba, req, headAttr, mouthAttr);
    }

    /**
     * @dev Retrieves attributes for equipped items
     * @param _tokenId The ID of the Familiar
     * @return headAttr Attributes of equipped head item
     * @return mouthAttr Attributes of equipped mouth item
     */
    function _getEquippedItemAttributes(
        uint256 _tokenId
    )
        private
        view
        returns (
            FamiliarsLib.ItemAttributes memory headAttr,
            FamiliarsLib.ItemAttributes memory mouthAttr
        )
    {
        FamiliarsLib.EquipItems memory equipped = familiars.getEquippedItems(
            _tokenId
        );

        if (equipped.head != 0) {
            headAttr = familiarsItem.getItemAttributes(equipped.head);
        }
        if (equipped.mouth != 0) {
            mouthAttr = familiarsItem.getItemAttributes(equipped.mouth);
        }
    }

    /**
     * @dev Processes health changes for a Familiar
     * @param _tokenId The ID of the Familiar
     * @param currentHealth Current health value
     * @param req Location requirements
     * @param headAttr Head item attributes
     * @param mouthAttr Mouth item attributes
     */
    function _processHealthChanges(
        uint256 _tokenId,
        uint256 currentHealth,
        FamiliarsLib.Requirements memory req,
        FamiliarsLib.ItemAttributes memory headAttr,
        FamiliarsLib.ItemAttributes memory mouthAttr
    ) private {
        unchecked {
            uint256 healthGain = req.getHealth +
                headAttr.healthIncrease +
                mouthAttr.healthIncrease;
            uint256 healthLoss = req.healthCost +
                headAttr.healthDecrease +
                mouthAttr.healthDecrease;
            uint256 newHealth;
            if (currentHealth + healthGain >= healthLoss) {
                newHealth = currentHealth + healthGain - healthLoss;
            } else {
                newHealth = 0;
            }

            familiars.setHealth(_tokenId, uint8(newHealth));
        }
    }

    /**
     * @dev Processes Karmic Energy changes
     * @param _tba Token Bound Account address
     * @param req Location requirements
     * @param headAttr Head item attributes
     * @param mouthAttr Mouth item attributes
     */
    function _processKarmicEnergyChanges(
        address _tba,
        FamiliarsLib.Requirements memory req,
        FamiliarsLib.ItemAttributes memory headAttr,
        FamiliarsLib.ItemAttributes memory mouthAttr
    ) private {
        uint256 karmicGain = req.getKarmicEnergy +
            headAttr.karmicIncrease +
            mouthAttr.karmicIncrease;
        uint256 karmicLoss = req.karmicEnergyCost +
            headAttr.karmicDecrease +
            mouthAttr.karmicDecrease;

        if (karmicGain > karmicLoss) {
            _giveKarmicEnergyToNPC(_tba, karmicGain - karmicLoss);
        } else if (karmicGain < karmicLoss) {
            karmicEnergy.burn(_tba, RESOURCE_TOKEN_ID, karmicLoss - karmicGain);
        }
    }

    /**
     * @dev Processes Food changes
     * @param _tba Token Bound Account address
     * @param req Location requirements
     * @param headAttr Head item attributes
     * @param mouthAttr Mouth item attributes
     */
    function _processFoodChanges(
        address _tba,
        FamiliarsLib.Requirements memory req,
        FamiliarsLib.ItemAttributes memory headAttr,
        FamiliarsLib.ItemAttributes memory mouthAttr
    ) private {
        uint256 foodGain = req.getFood +
            headAttr.foodIncrease +
            mouthAttr.foodIncrease;
        uint256 foodLoss = req.foodCost +
            headAttr.foodDecrease +
            mouthAttr.foodDecrease;

        if (foodGain > foodLoss) {
            _giveFoodToNPC(_tba, foodGain - foodLoss);
        } else if (foodGain < foodLoss) {
            food.burn(_tba, RESOURCE_TOKEN_ID, foodLoss - foodGain);
        }
    }

    /**
     * @dev Processes Coin changes
     * @param _tba Token Bound Account address
     * @param req Location requirements
     * @param headAttr Head item attributes
     * @param mouthAttr Mouth item attributes
     */
    function _processCoinChanges(
        address _tba,
        FamiliarsLib.Requirements memory req,
        FamiliarsLib.ItemAttributes memory headAttr,
        FamiliarsLib.ItemAttributes memory mouthAttr
    ) private {
        uint256 coinGain = req.getCoin +
            headAttr.coinIncrease +
            mouthAttr.coinIncrease;
        uint256 coinLoss = req.coinCost +
            headAttr.coinDecrease +
            mouthAttr.coinDecrease;

        if (coinGain > coinLoss) {
            _giveCoinsToNPC(_tba, coinGain - coinLoss);
        } else if (coinGain < coinLoss) {
            coins.burnFrom(_tba, coinLoss - coinGain);
        }
    }

    /**
     * @dev Mints coins to a specified address
     * @param to Recipient address
     * @param amount Amount of coins to mint
     */
    function _giveCoinsToNPC(address to, uint256 amount) internal {
        coins.mint(to, amount);
    }

    /**
     * @dev Mints food to a specified address
     * @param to Recipient address
     * @param amount Amount of food to mint
     */
    function _giveFoodToNPC(address to, uint256 amount) internal {
        food.mint(to, amount);
    }

    /**
     * @dev Mints Karmic Energy to a specified address
     * @param to Recipient address
     * @param amount Amount of Karmic Energy to mint
     */
    function _giveKarmicEnergyToNPC(address to, uint256 amount) internal {
        karmicEnergy.mint(to, amount);
    }

    /**
     * @dev Utility function for getting TBA
     * @param _tokenId Token id of the NFT
     * @return address
     */
    function _createTba(
        uint256 _tokenId,
        bytes calldata initData
    ) internal returns (address) {
        ERC6551Registry registry = ERC6551Registry(TBA_REGISTRY);
        return
            registry.createAccount(
                TBA_IMPL,
                CHAINID,
                address(familiars),
                _tokenId,
                3123,
                initData
            );
    }

    /**
     * @dev Utility function for getting TBA
     * @param _tokenId Token id of the NFT
     * @return address
     */
    function _getTba(uint256 _tokenId) public view returns (address) {
        ERC6551Registry registry = ERC6551Registry(TBA_REGISTRY);
        return
            registry.account(
                TBA_IMPL,
                CHAINID,
                address(familiars),
                _tokenId,
                3123
            );
    }

    /**
     * @dev Pauses or unpauses the contract
     * @param isPause True to pause, false to unpause
     */
    function setPauseContract(bool isPause) external onlyOwner {
        if (isPause) {
            _pause();
        } else {
            _unpause();
        }
    }

    /**
     * @dev Pauses or unpauses the contract
     * @param _newVerifier True to pause, false to unpause
     */
    function setVerifier(address _newVerifier) external onlyOwner {
        verifier = _newVerifier;
        emit FamiliarsLib.SetVerifier(_newVerifier);
    }
}
