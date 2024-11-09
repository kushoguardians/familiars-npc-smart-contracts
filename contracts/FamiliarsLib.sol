// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title FamiliarsLib
 * @dev Library containing core functionality for the Familiars game mechanics
 * @notice Handles location management and resource requirement checking
 */
library FamiliarsLib {
    /**
     * @dev Enum defining all possible locations in the game
     */
    enum Location {
        KARMIC_WELLSPRING, // Location for karma-related activities
        KARMIC_TOWER, // Advanced karma-related location
        HOME, // Default resting location
        GATHERING_AREA, // Resource gathering location
        MARKET_PLACE // Market place to buy food and coins excgange of karmic energy
    }

    /**
     * @dev Struct representing the attributes that can be modified by Familiar Items
     * @notice Includes minimum requirements and resource costs associated with each attribute
     */
    struct ItemAttributes {
        uint8 healthIncrease;
        uint8 healthDecrease;
        uint8 karmicIncrease;
        uint8 karmicDecrease;
        uint8 foodIncrease;
        uint8 foodDecrease;
        uint8 coinIncrease;
        uint8 coinDecrease;
        uint8 luckIncrease;
        uint8 luckDecrease;
    }

    /**
     * @dev Struct representing the equiped item of Familiar
     */
    struct EquipItems {
        uint256 head;
        uint256 mouth;
    }

    /**
     * @dev Struct defining requirements and rewards for locations
     * @notice Contains minimum requirements and costs for various resources
     */
    struct Requirements {
        uint8 minHealth; // Minimum health required
        uint8 healthCost; // Health cost for action
        uint8 minKarmicEnergy; // Minimum karmic energy required
        uint8 karmicEnergyCost; // Karmic energy cost for action
        uint8 minFood; // Minimum food required
        uint8 foodCost; // Food cost for action
        uint8 minCoin; // Minimum coins required
        uint8 coinCost; // Coin cost for action
        uint8 getCoin; // Coins received as reward
        uint8 getHealth; // Health received as reward
        uint8 getKarmicEnergy; // Karmic energy received as reward
        uint8 getFood; // Food received as reward
    }

    // Events
    event GoToLocation(uint256 indexed tokenId, string location);
    event GetCurrentLocation(uint256 indexed tokenId, string location);
    event SetHealth(uint256 indexed tokenId, uint256 health);
    event SetLocationRequirements(Location location, Requirements req);
    event KarmicExchanged(
        address indexed user,
        uint256 karmicAmount,
        uint256 coinsReceived,
        uint256 foodReceived
    );
    event SetVerifier(address indexed _newVerifier);

    // Custom errors
    error InsufficientHealth(uint8 required, uint256 current);
    error InsufficientKarmicEnergy(uint256 required, uint256 current);
    error InsufficientFood(uint256 required, uint256 current);
    error InsufficientCoins(uint256 required, uint256 current);

    /**
     * @dev Validates if a familiar meets the requirements for an action
     * @param _currentHealth Current health of the familiar
     * @param _currentCoins Current coins owned by the familiar
     * @param _currentFood Current food owned by the familiar
     * @param _currentKarmicEnergy Current karmic energy of the familiar
     * @param _locationRequirements Requirements structure for the location
     * @notice Reverts if any requirement is not met
     */
    function checkRequirements(
        uint256 _currentHealth,
        uint256 _currentCoins,
        uint256 _currentFood,
        uint256 _currentKarmicEnergy,
        Requirements memory _locationRequirements
    ) external pure {
        Requirements memory req = _locationRequirements;

        // Check minimum requirements
        if (_currentHealth < req.minHealth) {
            revert InsufficientHealth(req.minHealth, _currentHealth);
        }
        if (_currentKarmicEnergy < req.minKarmicEnergy) {
            revert InsufficientKarmicEnergy(
                req.minKarmicEnergy,
                _currentKarmicEnergy
            );
        }
        if (_currentFood < req.minFood) {
            revert InsufficientFood(req.minFood, _currentFood);
        }
        if (_currentCoins < req.minCoin) {
            revert InsufficientCoins(req.minCoin, _currentCoins);
        }

        // Check if has enough resources for costs
        if (_currentHealth < req.healthCost) {
            revert InsufficientHealth(req.healthCost, _currentHealth);
        }
        if (_currentKarmicEnergy < req.karmicEnergyCost) {
            revert InsufficientKarmicEnergy(
                req.karmicEnergyCost,
                _currentKarmicEnergy
            );
        }
        if (_currentFood < req.foodCost) {
            revert InsufficientFood(req.foodCost, _currentFood);
        }
        if (_currentCoins < req.coinCost) {
            revert InsufficientCoins(req.coinCost, _currentCoins);
        }
    }

    /**
     * @dev Verifies the signature of a gift claim.
     * @param _nonce The nonce of the contract.
     * @param _chainId The chainId of the contract where is deployed.
     * @param _caller The address of the receiver.
     * @param _signature The signature to verify.
     * @return signer The address of the signer.
     */
    function getVerifier(
        uint256 _nonce,
        uint256 _chainId,
        address _caller,
        bytes calldata _signature
    ) internal pure returns (address signer) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_nonce, _chainId, _caller)
        );
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        return ECDSA.recover(ethSignedMessageHash, _signature);
    }
}
