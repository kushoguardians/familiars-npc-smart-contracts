// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Import required OpenZeppelin contracts for standard implementations
import "@openzeppelin/contracts/access/Ownable.sol"; // Provides basic access control
import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // Base NFT implementation
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // Adds URI storage capabilities
import "./FamiliarsLib.sol";

/**
 * @title Familiars
 * @dev A smart contract for managing NFT-based familiar creatures with location tracking and health systems
 * @notice This contract implements ERC721 standard with additional features for game mechanics
 * @dev Inherits from:
 *      - ERC721: Base NFT functionality
 *      - Ownable: Access control
 *      - ERC721URIStorage: Token URI management
 * TODO Add equipable NFT functionality
 */

contract Familiars is ERC721, Ownable, ERC721URIStorage {
    /**
     * @dev Counter for the next token ID to be minted
     */
    uint256 private _nextTokenId;

    /**
     * @dev Tracks the most recently minted token ID
     */
    uint256 public latestTokenId;

    /**
     * @dev Mapping to track the current location of each token
     * @notice Private to enforce access through getter/setter functions
     */
    mapping(uint256 => FamiliarsLib.Location) private tokenLocation;

    /**
     * @dev Mapping to store health points for each token
     * @notice Private to enforce access through getter/setter functions
     */
    mapping(uint256 => uint8) private tokenHealth;

    /**
     * @dev Modifier to verify token existence before operations
     * @param tokenId The ID of the token to verify
     */
    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }

    /**
     * @dev Constructor initializes the ERC721 token with name "Familiars" and symbol "FMLRS"
     */
    constructor(
    ) ERC721("Familiars", "FMLRS") Ownable(_msgSender()) {}

    /**
     * @dev Safely mints a new token and sets initial properties
     * @param _to Address to receive the minted token
     * @param _uri The token URI containing metadata
     * @notice Only callable by contract owner
     */
    function safeMint(address _to, string memory _uri) external onlyOwner {
        uint256 tokenId = _nextTokenId+1;
        latestTokenId = tokenId;
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _uri);
        tokenHealth[tokenId] = 50;
        tokenLocation[tokenId] = FamiliarsLib.Location.HOME;
    }

    /**
     * @dev Sets the health value for a specific token
     * @param _tokenId The ID of the token to modify
     * @param _health The new health value (0-50)
     * @notice Only callable by contract owner
     */
    function setHealth(
        uint256 _tokenId,
        uint8 _health
    ) external onlyOwner tokenExists(_tokenId) {
        require(_health > 0 && _health <= 50, "Health out of range");
        tokenHealth[_tokenId] = _health;
        emit FamiliarsLib.SetHealth(_tokenId, _health);
    }

    /**
     * @dev Gets the health value for a specific token
     * @param _tokenId The ID of the token to query
     * @return uint8 The current health value of the token
     */
    function getHealth(
        uint256 _tokenId
    ) external view tokenExists(_tokenId) returns (uint8) {
        return tokenHealth[_tokenId];
    }

    /**
     * @dev Moves a NPC to a new location
     * @param _tokenId The ID of the token to move
     * @param _location The destination location
     * @notice Only callable by contract owner
     */
    function goToLocation(
        uint256 _tokenId,
        FamiliarsLib.Location _location
    ) external onlyOwner tokenExists(_tokenId) {
        tokenLocation[_tokenId] = _location;
        emit FamiliarsLib.GoToLocation(_tokenId, locationToString(_location));
    }

    /**
     * @dev Gets the current location of a NPC
     * @param _tokenId The ID of the token to query
     * @return string The location name as a string
     */
    function getCurrentLocation(
        uint256 _tokenId
    ) external view tokenExists(_tokenId) returns (string memory) {
        FamiliarsLib.Location _location = tokenLocation[_tokenId];
        return locationToString(_location);
    }

    /**
     * @dev Converts Location enum to human-readable string
     * @param _location The Location enum value to convert
     * @return string The human-readable location name
     * @notice Internal helper function for location conversion
     */
    function locationToString(
        FamiliarsLib.Location _location
    ) internal pure returns (string memory) {
        if (_location == FamiliarsLib.Location.KARMIC_WELLSPRING)
            return "Karmic Wellspring";
        if (_location == FamiliarsLib.Location.HOME) return "Home";
        if (_location == FamiliarsLib.Location.KARMIC_TOWER)
            return "Karmic Tower";
        if (_location == FamiliarsLib.Location.GATHERING_AREA)
            return "Gathering Area";
        return "Home";
    }

    /**
     * @dev Required override for tokenURI function due to multiple inheritance
     * @param tokenId The ID of the token to query
     * @return string The URI containing token metadata
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Required override for supportsInterface function due to multiple inheritance
     * @param interfaceId The interface identifier to check
     * @return bool True if the contract supports the interface
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
