// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol"; // Provides basic access control
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Familiars.sol";
import "./FamiliarsLib.sol";
import "./Coins.sol";
import "./KarmicEnergy.sol";
import "./Food.sol";
import "./FamiliarsItem.sol";

contract KarmicWellSpring is Ownable, Pausable, ReentrancyGuard {
    // Contract instances for different game components
    Familiars public familiars; // Contract managing Familiar NFTs
    Coins public coins; // Contract managing in-game currency
    KarmicEnergy public karmicEnergy; // Contract managing Karmic Energy resource
    Food public food; // Contract managing Food resource

    /**
     * @dev Operator contract address
     */
    address public operator;

    constructor(
        address _karmic,
        address _food,
        address _coins
    ) Ownable(_msgSender()) {
        operator = _msgSender();
        karmicEnergy = KarmicEnergy(_karmic);
        food = Food(_food);
        coins = Coins(_coins);
    }

    // Exchange rates mapping
    mapping(uint256 => uint256) public karmicToCoins;
    mapping(uint256 => uint256) public karmicToFood;
    mapping(uint256 => bool) public validKarmicAmt;

    // Events
    event SetNewOperator(address indexed newOpertor);

    /**
     * @dev Modifier to restrict function access to only the specified operator
     * @param _caller The address of the function caller
     * @dev Throws if the caller is not the authorized operator
     */
    modifier onlyOperator(address _caller) {
        require(operator == _caller, "Caller is not the operator");
        _;
    }

    /**
     * @dev Exchange karmic energy for food and coins
     * @param _karmicAmount Amount of karmic energy to exchange
     * @param _tba TBA
     */
    function exchangeKarmicEnergy(
        uint256 _karmicAmount,
        address _tba
    ) external onlyOperator(_msgSender()) whenNotPaused {
        require(_karmicAmount > 0, "Amount must be greater than 0");
        require(validKarmicAmt[_karmicAmount], "Amount must be on valid tier");

        uint256 karmicBal = karmicEnergy.balanceOf(_tba, 0);
        require(karmicBal >= _karmicAmount, "Not enough karmic energy");

        // Calculate rewards
        (uint256 coinsToMint, uint256 foodToMint) = _calculateRewards(
            _karmicAmount
        );
        require(coinsToMint > 0 && foodToMint > 0, "Invalid exchange amount");

        // Burn karmic energy
        karmicEnergy.burn(_tba, 0, _karmicAmount);

        // Mint rewards
        food.mint(_tba, foodToMint);
        coins.mint(_tba, coinsToMint);

        emit FamiliarsLib.KarmicExchanged(
            _tba,
            _karmicAmount,
            coinsToMint,
            foodToMint
        );
    }

    /**
     * @dev Add or update exchange rate
     * @param _karmicAmount Amount of karmic energy required
     * @param _coinsReward Amount of coins to reward
     * @param _foodReward Amount of food to reward
     */
    function addExchangeRate(
        uint256 _karmicAmount,
        uint256 _coinsReward,
        uint256 _foodReward
    ) external onlyOwner {
        require(_karmicAmount > 0, "Invalid karmic amount");
        require(_coinsReward > 0 || _foodReward > 0, "Invalid rewards");

        if (!validKarmicAmt[_karmicAmount]) {
            validKarmicAmt[_karmicAmount] = true;
        }

        karmicToCoins[_karmicAmount] = _coinsReward;
        karmicToFood[_karmicAmount] = _foodReward;
    }

    /**
     * @dev update exchange rate
     * @param _karmicAmount Amount of karmic energy to remove
     * @param _coinsReward Amount of coins to reward
     * @param _foodReward Amount of food to reward
     */
    function updateExchangeRate(
        uint256 _karmicAmount,
        uint256 _coinsReward,
        uint256 _foodReward
    ) external onlyOwner {
        require(validKarmicAmt[_karmicAmount], "Exchange rate does not exist");

        validKarmicAmt[_karmicAmount] = true;
        karmicToCoins[_karmicAmount] = _coinsReward;
        karmicToFood[_karmicAmount] = _foodReward;
    }

    /**
     * @dev Remove exchange rate
     * @param _karmicAmount Amount of karmic energy to remove
     */
    function removeExchangeRate(uint256 _karmicAmount) external onlyOwner {
        require(validKarmicAmt[_karmicAmount], "Exchange rate does not exist");

        validKarmicAmt[_karmicAmount] = false;
        karmicToCoins[_karmicAmount] = 0;
        karmicToFood[_karmicAmount] = 0;
    }

    /**
     * @dev Internal function to calculate rewards based on karmic energy amount
     */
    function _calculateRewards(
        uint256 _karmicAmount
    ) public view returns (uint256 coinsReward, uint256 foodReward) {
        uint256 totalCoins = karmicToCoins[_karmicAmount];
        uint256 totalFood = karmicToCoins[_karmicAmount];

        return (totalCoins, totalFood);
    }

    /**
     * @dev Update operator address
     * @param _newOperator Address new operator
     * @notice Only callable by contract owner
     */
    function setOperator(address _newOperator) external onlyOwner {
        operator = _newOperator;
        emit SetNewOperator(_newOperator);
    }

    /**
     * @dev Internal function to add or update exchange rate
     */
    function _addExchangeRate(
        uint256 _karmicAmount,
        uint256 _coinsReward,
        uint256 _foodReward
    ) internal {
        bool _karmicAmt = validKarmicAmt[_karmicAmount];
        if (!_karmicAmt) {
            validKarmicAmt[_karmicAmount] = true;
        }
        karmicToCoins[_karmicAmount] = _coinsReward;
        karmicToFood[_karmicAmount] = _foodReward;
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

}
