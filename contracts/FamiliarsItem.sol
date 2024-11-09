// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "./FamiliarsLib.sol";
import "./Familiars.sol";

/**
 * @title FamiliarsItem
 * @dev Implementation of ERC1155 token for FamiliarsItem equipable item in the game
 * @notice This contract manages the FamiliarsItem resource which can be minted and burned
 */
contract FamiliarsItem is ERC1155, ERC1155Burnable, Ownable {
    // Contract instances for different game components
    Familiars public familiars; // Contract managing Familiar NFTs
    // Operator contract address
    address public operator;

    /**
     * @dev Marketplace contract address
     */
    address public marketplace;

    // Mapping to store item attributes for each token ID
    mapping(uint256 => FamiliarsLib.ItemAttributes) private itemAttributes;

    // Event emitted when a new operator is set
    event SetNewOperator(address indexed newOperator);
    event SetNewMarketplace(address indexed newMarketplace);

    /**
     * @dev Constructor initializes the contract with IPFS URI for token metadata
     * @notice Sets the initial URI and transfers ownership to the deployer
     */
    constructor()
        ERC1155("https://game.example/api/item/{id}.json")
        Ownable(_msgSender())
    {
        operator = _msgSender();
        marketplace = _msgSender();
    }

    /**
     * @dev Modifier to restrict function access to only the specified operator
     * @dev Throws if the caller is not the authorized operator
     */
    modifier onlyOperator() {
        require(operator == _msgSender(), "Caller is not the operator");
        _;
    }

    /**
     * @dev Updates the base URI for token metadata
     * @param newuri New URI to be set
     * @notice Only callable by contract operator
     */
    function setURI(string memory newuri) public onlyOperator {
        _setURI(newuri);
    }

    /**
     * @dev Mints FamiliarsItem tokens
     * @param account Address to receive the tokens
     * @param tokenId TokenId of the item
     * @param amount Amount of tokens to mint
     * @param _itemAttributes Item attributes
     * @notice Only callable by contract operator
     */
    function mint(
        address account,
        uint256 tokenId,
        uint256 amount,
        FamiliarsLib.ItemAttributes calldata _itemAttributes
    ) public onlyOperator {
        require(tokenId != 0, "Token ID 0 is not allowed");
        _mint(account, tokenId, amount, "");
        itemAttributes[tokenId] = _itemAttributes;
    }

    /**
     * @dev Mints FamiliarsItem tokens
     * @param account Address to receive the tokens
     * @param tokenId TokenId of the item
     * @param amount Amount of tokens to mint
     * @param _itemAttributes Item attributes
     * @notice Only callable by contract owner
     */
    function ownerMint(
        address account,
        uint256 tokenId,
        uint256 amount,
        FamiliarsLib.ItemAttributes calldata _itemAttributes
    ) public onlyOwner {
        require(tokenId != 0, "Token ID 0 is not allowed");
        _mint(account, tokenId, amount, "");
        itemAttributes[tokenId] = _itemAttributes;
    }

    /**
     * @dev Mints multiple token types in a single transaction
     * @param to Address to receive the tokens
     * @param ids Array of token IDs to mint
     * @param amounts Array of amounts to mint for each token ID
     * @param data Additional data to pass to receivers
     * @notice Only callable by contract operator
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] != 0, "Token ID 0 is not allowed");
        }
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Retrieves item attributes for a given token ID
     * @param _tokenId ID of the item
     * @return FamiliarsLib.ItemAttributes
     */
    function getItemAttributes(
        uint256 _tokenId
    ) external view returns (FamiliarsLib.ItemAttributes memory) {
        return itemAttributes[_tokenId];
    }

    /**
     * @dev Sets item attributes for a given token ID
     * @param _tokenId ID of the item
     * @param _itemAttributes New item attributes
     * @notice Only callable by contract operator
     */
    function setItemAttributes(
        uint256 _tokenId,
        FamiliarsLib.ItemAttributes memory _itemAttributes
    ) external onlyOwner returns (FamiliarsLib.ItemAttributes memory) {
        itemAttributes[_tokenId] = _itemAttributes;
        return _itemAttributes;
    }

    /**
     * @dev Update operator address
     * @param _newOperator Address of the new operator
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
}
