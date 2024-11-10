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

contract Marketplace is Ownable, Pausable, ReentrancyGuard {
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

    // Events
    event SetNewOperator(address indexed newOpertor);
    event FoodExchange(address indexed tba, uint256 coins, uint256 food);
    event BuyTreasureBox(address indexed tba, uint256 getCoins);

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
     * @dev Exchange coins to food
     * @param _coinsAmt amount of coins to exchange
     * @param _tba TBA
     * @dev Throws if the caller is not the authorized operator
     */
    function exchangeCoinsToFood(
        uint256 _coinsAmt,
        address _tba
    ) public onlyOperator(_msgSender()) whenNotPaused {
        require(_coinsAmt > 0, "Amount must be greater than 0");
        uint256 coinsBal = coins.balanceOf(_tba);
        uint256 amt = _coinsAmt * (10 ** coins.decimals());
        require(coinsBal >= amt, "Not enough coins");

        coins.burnCoins(_tba, amt);
        food.mint(_tba, _coinsAmt);
        emit FoodExchange(_tba, _coinsAmt, _coinsAmt);
    }

    /**
     * @dev Buy Treasure box get 1 -20 coins
     * @param _tba TBA
     * @dev Throws if the caller is not the authorized operator
     */
    function buyTreasureBox(
        address _tba
    ) public onlyOperator(_msgSender()) whenNotPaused {
        uint256 coinsBal = coins.balanceOf(_tba);
        uint256 price = 5 * (10 ** coins.decimals());
        require(coinsBal >= price, "Not enough coins");

        coins.burnCoins(_tba, price);

        uint256 getCoins = _generateRandomNumber(20);

        coins.mint(_tba, getCoins);
        emit BuyTreasureBox(_tba, getCoins);
    }

    /**
     * @dev Internal function Update operator address
     * @param maxRange max generation number
     * @return uint256
     */
    function _generateRandomNumber(
        uint maxRange
    ) internal view returns (uint256) {
        require(maxRange > 0, "Range must be greater than 0");

        // Using block information and timestamp to generate pseudo-random number
        uint256 randomNumber = (uint(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    block.number,
                    block.coinbase,
                    address(this)
                )
            )
        ) % maxRange) + 1; // Modulo maxRange plus 1 to get number between 1 and maxRange

        return randomNumber;
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
     * @dev Update operator address
     * @param _newOperator Address new operator
     * @notice Only callable by contract owner
     */
    function setOperator(address _newOperator) external onlyOwner {
        operator = _newOperator;
        emit SetNewOperator(_newOperator);
    }
}
