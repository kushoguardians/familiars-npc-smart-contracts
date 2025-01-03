// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./FamiliarsLib.sol";

/**
 * @title Coins
 * @dev Implementation of the game's coin system with transfer restrictions
 * @notice This contract implements ERC20 token with whitelist functionality
 */
contract Coins is ERC20, Ownable, ERC20Permit, ERC20Burnable {
    /**
     * @dev Operator contract address
     */
    address public operator;

    /**
     * @dev Marketplace contract address
     */
    address public marketplace;

    /**
     * @dev karmicSpring contract address
     */
    address public karmicSpring;

    /**
     * @dev Constructor initializes the coin contract
     * @notice Sets up the token with name "Coins" and symbol "Coins"
     */
    constructor()
        ERC20("Coins", "Coins")
        Ownable(_msgSender())
        ERC20Permit("Coins")
    {
        operator = _msgSender();
        marketplace = _msgSender();
    }

    // Events
    event SetNewOperator(address indexed newOpertor);
    event SetNewMarketplace(address indexed newMarketplace);
    event SetNewKarmicWellSpring(address indexed newKarmic);

    /**
     * @dev Modifier to restrict function access to only the specified operator/marketplace
     * @dev Throws if the caller is not the authorized operator/marketplace
     */
    modifier onlyOperators() {
        require(
            operator == _msgSender() ||
                marketplace == _msgSender() ||
                karmicSpring == _msgSender(),
            "Caller is not the operator or marketplace"
        );
        _;
    }

    /**
     * @dev Mints new coins to a specified address
     * @param to Address to receive the coins
     * @param amount Amount of coins to mint (before decimals)
     * @notice Only callable by contract operator/marketplace
     */
    function mint(address to, uint256 amount) public onlyOperators {
        uint256 mintAmount = amount * (10 ** decimals());
        _mint(to, mintAmount);
    }

    /**
     * @dev Burncoins to a specified address
     * @param account Address to receive the coins
     * @param amount Amount of coins to burn
     * @notice Only callable by contract operator/marketplace
     */
    function burnCoins(address account, uint256 amount) public onlyOperators {
        _burn(account, amount);
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
     * @dev Update marketplace address
     * @param _marketplace Address new operator
     * @notice Only callable by contract owner
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
        emit SetNewMarketplace(_marketplace);
    }

    /**
     * @dev Update karmic sprinf address
     * @param _karmicWellspring Address new operator
     * @notice Only callable by contract owner
     */
    function setKarmicWellSpring(address _karmicWellspring) external onlyOwner {
        karmicSpring = _karmicWellspring;
        emit SetNewKarmicWellSpring(_karmicWellspring);
    }
}
