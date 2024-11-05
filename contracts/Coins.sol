// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title Coins
 * @dev Implementation of the game's coin system with transfer restrictions
 * @notice This contract implements ERC20 token with whitelist functionality
 */
contract Coins is ERC20, Ownable, ERC20Permit, ERC20Burnable {
    // Mapping to track whitelisted addresses
    mapping(address => bool) private _whitelist;

    /**
     * @dev Constructor initializes the coin contract
     * @notice Sets up the token with name "Coins" and symbol "Coins"
     */
    constructor()
        ERC20("Coins", "Coins")
        Ownable(_msgSender())
        ERC20Permit("Coins")
    {}

    /**
     * @dev Mints new coins to a specified address
     * @param to Address to receive the coins
     * @param amount Amount of coins to mint (before decimals)
     * @notice Only callable by contract owner
     */
    function mint(address to, uint256 amount) public onlyOwner {
        uint256 mintAmount = amount * (10 ** decimals());
        _mint(to, mintAmount);
    }

    /**
     * @dev Override of ERC20 transfer function with whitelist check
     * @param recipient Address to receive the coins
     * @param amount Amount of coins to transfer
     * @return bool indicating success
     * @notice Only whitelisted addresses can initiate transfers
     */
    function transfer(
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        require(
            _whitelist[msg.sender],
            "Only whitelisted addresses can initiate transfers"
        );
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @dev Override of ERC20 transferFrom function with whitelist check
     * @param sender Address sending the coins
     * @param recipient Address receiving the coins
     * @param amount Amount of coins to transfer
     * @return bool indicating success
     * @notice Only whitelisted addresses can initiate transfers
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        require(
            _whitelist[sender],
            "Only whitelisted addresses can initiate transfers"
        );
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            allowance(sender, _msgSender()) - amount
        );
        return true;
    }

    /**
     * @dev Adds or removes an address from the whitelist
     * @param account Address to modify whitelist status
     * @param value Boolean indicating whitelist status
     * @notice Only callable by contract owner
     */
    function setWhitelisted(address account, bool value) external {
        require(
            msg.sender == owner(),
            "Only the owner can modify the whitelist"
        );
        _whitelist[account] = value;
    }
}
