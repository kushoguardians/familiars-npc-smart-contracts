// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Food
 * @dev Implementation of ERC1155 token for Food resources in the game
 * @notice This contract manages the Food resource which can be minted and burned
 */
contract Food is ERC1155, Ownable {
    /**
     * @dev Operator contract address
     */
    address public operator;

    /**
     * @dev Marketplace contract address
     */
    address public marketplace;

    /**
     * @dev Constructor initializes the contract with IPFS URI for token metadata
     * @notice Sets the initial URI and transfers ownership to the deployer
     */
    constructor()
        ERC1155("ipfs://QmUE1hMRA85uaaoYAotPxXzAfVUy4hsMHyyjPXvayQQWHB")
        Ownable(_msgSender())
    {
        operator = _msgSender();
        marketplace = _msgSender();
    }

    // Events
    event SetNewOperator(address indexed newOpertor);
    event SetNewMarketplace(address indexed newMarketplace);

    /**
     * @dev Modifier to restrict function access to only the specified operator/marketplace
     * @param _caller The address of the function caller
     * @dev Throws if the caller is not the authorized operator/marketplace
     */
    modifier onlyOperatorOrMarketplace(address _caller) {
        require(
            operator == _caller || marketplace == _caller,
            "Caller is not the operator or marketplace"
        );
        _;
    }

    /**
     * @dev Updates the base URI for token metadata
     * @param newuri New URI to be set
     * @notice Only callable by contract operator
     */
    function setURI(
        string memory newuri
    ) public onlyOperatorOrMarketplace(_msgSender()) {
        _setURI(newuri);
    }

    /**
     * @dev Mints Food tokens
     * @param account Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @notice Only callable by contract operator, always mints token ID 0
     */
    function mint(
        address account,
        uint256 amount
    ) public onlyOperatorOrMarketplace(_msgSender()) {
        _mint(account, 0, amount, new bytes(0));
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
    ) public onlyOperatorOrMarketplace(_msgSender()) {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Burns a specific amount of tokens from an account
     * @param account Address to burn tokens from
     * @param id Token ID to burn
     * @param value Amount of tokens to burn
     * @notice Only callable by contract operator/marketplace
     */
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public virtual onlyOperatorOrMarketplace(_msgSender()) {
        _burn(account, id, value);
    }

    /**
     * @dev Burns multiple token types in a single transaction
     * @param account Address to burn tokens from
     * @param ids Array of token IDs to burn
     * @param values Array of amounts to burn for each token ID
     * @notice Only callable by contract operator/marketplace
     */
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual onlyOperatorOrMarketplace(_msgSender()) {
        _burnBatch(account, ids, values);
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
}
