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

/**
 * @title Operator
 * @dev Contract managing interactions between Familiars and various game resources
 * @notice Handles location changes and resource management for the game
 */
contract Operator is Ownable, Pausable {
    // Contract instances for different game components
    Familiars public familiars; // Contract managing Familiar NFTs
    Coins public coins; // Contract managing in-game currency
    KarmicEnergy public karmicEnergy; // Contract managing Karmic Energy resource
    Food public food; // Contract managing Food resource

    // Address authorized to verify certain operations
    address verifier;

    //Todo: add marketplace contract and functionality

    // Constant used to identify resource tokens across different contracts
    uint256 private constant RESOURCE_TOKEN_ID = 0;

    // Mapping to track requirements needed for each location
    mapping(FamiliarsLib.Location => FamiliarsLib.Requirements)
        public locationRequirements;

    // Mapping to prevent replay attacks by tracking used nullifiers
    mapping(bytes => bool) private nullifier;

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
        address _karmicEnergy
    ) Ownable(_msgSender()) {
        verifier = _msgSender();
        familiars = Familiars(_familiars);
        food = Food(_food);
        coins = Coins(_coins);
        karmicEnergy = KarmicEnergy(_karmicEnergy);
    }

    // Function to receive ETH
    receive() external payable {}

    /**
     * @dev Creates a new NPC (Non-Player Character) Familiar
     * @param _to Address to receive the NPC
     * @param _uri Metadata URI for the NPC
     */
    function createNPC(address _to, string memory _uri) external whenNotPaused {
        // TODO: add a checker?
        familiars.safeMint(_to, _uri);
    }

    /**
     * @dev Sets the requirements for a specific location
     * @param _location The location to set requirements for
     * @param _requirements The requirements to be set for the location
     * @return The updated requirements for the location
     */
    function setLocationRequirements(
        FamiliarsLib.Location _location,
        FamiliarsLib.Requirements memory _requirements
    )
        external
        onlyOwner
        whenNotPaused
        returns (FamiliarsLib.Requirements memory)
    {
        locationRequirements[_location] = _requirements;
        emit FamiliarsLib.SetLocationRequirements(_location, _requirements);
        return _requirements;
    }

    /**
     * @dev Moves a Familiar to a new location after checking requirements
     * @param _tokenId The ID of the Familiar
     * @param _tba Token Bound Account address
     * @param _location The destination location
     */
    function goToLocation(
        uint256 _tokenId,
        address _tba,
        FamiliarsLib.Location _location
    ) external whenNotPaused {
        _reqChecker(_tokenId, _tba);
        familiars.goToLocation(_tokenId, _location);
    }

    /**
     * @dev Gets the current stats of a Familiar
     * @param tokenId The ID of the Familiar
     * @return health Current health of the Familiar
     * @return location Current location of the Familiar
     */
    function getNPCStats(
        uint256 tokenId
    ) external view returns (uint8, string memory) {
        uint8 health = familiars.getHealth(tokenId);
        string memory location = familiars.getCurrentLocation(tokenId);
        return (health, location);
    }

    /**
     * @dev Checks and processes resource requirements for location changes
     * @param _tokenId The ID of the Familiar
     * @param _tba Token Bound Account address
     * @return Requirements structure containing the processed costs
     */
    function _reqChecker(
        uint256 _tokenId,
        address _tba
    ) internal returns (FamiliarsLib.Requirements memory) {
        // Get requirements for the gathering area
        FamiliarsLib.Requirements memory req = locationRequirements[
            FamiliarsLib.Location.GATHERING_AREA
        ];

        // Get current resource balances
        uint256 currentHealth = familiars.getHealth(_tokenId);
        uint256 currentKarmicEnergy = karmicEnergy.balanceOf(
            _tba,
            RESOURCE_TOKEN_ID
        );
        uint256 currentFood = food.balanceOf(_tba, RESOURCE_TOKEN_ID);
        uint256 currentCoins = coins.balanceOf(_tba);

        // Verify resource requirements are met
        FamiliarsLib.checkRequirements(
            currentHealth,
            currentCoins,
            currentFood,
            currentKarmicEnergy,
            req
        );

        // Process resource deductions based on requirements
        if (req.healthCost > 0) {
            familiars.setHealth(
                _tokenId,
                uint8(currentHealth - req.healthCost)
            );
        }

        if (req.karmicEnergyCost > 0) {
            //Todo: determine if karmicEnergy should go to treasury or be burned
            // karmicEnergy.burn(_tba, 0, req.karmicEnergyCost);
        }

        if (req.foodCost > 0) {
            //Todo: determine if food should go to treasury or be burned
            // food.burn(_tba, 0, req.foodCost);
        }

        if (req.coinCost > 0) {
            //Todo: determine if coins should go to treasury or be burned
            // coins.burnFrom(_tba, req.coinCost);
        }
        return req;
    }

    /**
     * @dev Mints coins to a specified address
     * @param to Recipient address
     * @param amount Amount of coins to mint
     */
    function giveCoinsToNPC(address to, uint256 amount) public {
        // TODO: add a tba checker?
        coins.mint(to, amount);
    }

    /**
     * @dev Mints food to a specified address
     * @param to Recipient address
     * @param amount Amount of food to mint
     */
    function giveFoodToNPC(address to, uint256 amount) public {
        // TODO: add a tba checker?
        food.mint(to, amount);
    }

    /**
     * @dev Mints Karmic Energy to a specified address
     * @param to Recipient address
     * @param amount Amount of Karmic Energy to mint
     */
    function giveKarmicEnergyToNPC(address to, uint256 amount) public {
        // TODO: add a tba checker?
        karmicEnergy.mint(to, amount);
    }

    /**
     * @dev Sets whitelist status for an address in the Coins contract
     * @param tba Address to set whitelist status for
     * @param status Whitelist status to set
     */
    function setWhitelistForCoins(address tba, bool status) public onlyOwner {
        // TODO: add a checker?
        coins.setWhitelisted(tba, status);
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
     * @dev Emergency function to recover native tokens (ETH)
     * @param _to Address to receive the recovered funds
     */
    function emergencyRecoverNative(address _to) public onlyOwner {
        uint256 balance = address(this).balance;
        payable(_to).transfer(balance);
        emit FamiliarsLib.EmergencyNativeRecovery(_to, balance);
    }
}
