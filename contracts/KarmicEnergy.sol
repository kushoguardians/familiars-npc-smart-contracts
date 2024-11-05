// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KarmicEnergy
 * @dev Implementation of ERC1155 token for Karmic Energy in the game
 * @notice This contract manages the Karmic Energy resource which can be minted and burned
 */
contract KarmicEnergy is ERC1155, ERC1155Burnable, Ownable {
    /**
     * @dev Constructor initializes the contract with IPFS URI for token metadata
     * @notice Sets the initial URI and transfers ownership to the deployer
     */
    constructor()
        ERC1155("ipfs://QmUE1hMRA85uaaoYAotPxXzAfVUy4hsMHyyjPXvayQQWHB")
        Ownable(_msgSender())
    {}

    /**
     * @dev Updates the base URI for token metadata
     * @param newuri New URI to be set
     * @notice Only callable by contract owner
     */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Mints Karmic Energy tokens
     * @param account Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @notice Only callable by contract owner, always mints token ID 0
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, 0, amount, new bytes(0));
    }

    /**
     * @dev Mints multiple token types in a single transaction
     * @param to Address to receive the tokens
     * @param ids Array of token IDs to mint
     * @param amounts Array of amounts to mint for each token ID
     * @param data Additional data to pass to receivers
     * @notice Only callable by contract owner
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Burns a specific amount of tokens from an account
     * @param account Address to burn tokens from
     * @param id Token ID to burn
     * @param value Amount of tokens to burn
     * @notice Only callable by contract owner
     */
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public virtual override onlyOwner {
        super.burn(account, id, value);
    }

    /**
     * @dev Burns multiple token types in a single transaction
     * @param account Address to burn tokens from
     * @param ids Array of token IDs to burn
     * @param values Array of amounts to burn for each token ID
     * @notice Only callable by contract owner
     */
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual override onlyOwner {
        super.burnBatch(account, ids, values);
    }
}
