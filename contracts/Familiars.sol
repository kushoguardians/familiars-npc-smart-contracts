// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Import required OpenZeppelin contracts for standard implementations
import "@openzeppelin/contracts/access/Ownable.sol"; // Provides basic access control
import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // Base NFT implementation
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
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
     * @dev Operator contract address
     */
    address public operator;
    /**
     * @dev Counter for the next token ID to be minted
     */
    uint256 private _nextTokenId;

    /**
     * @dev Tracks the most recently minted token ID
     */
    uint256 public latestTokenId;

    // Events
    event SetNewOperator(address indexed newOpertor);

    /**
     * @dev Mapping to track equipped item of familiar
     * @notice Private to enforce access through getter/setter functions
     */
    mapping(uint256 => FamiliarsLib.EquipItems) private equippedItem;

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

    // Mapping to track requirements needed for each location
    mapping(FamiliarsLib.Location => FamiliarsLib.Requirements)
        private locationRequirements;

    /**
     * @dev Modifier to verify token existence before operations
     * @param tokenId The ID of the token to verify
     */
    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }
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
     * @dev Modifier to restrict function access to only the specified operator or owner
     * @dev Throws if the caller is not the authorized operator or owner
     */
    modifier onlyOperatorOrOwner() {
        require(
            operator == _msgSender() || _msgSender() == owner(),
            "Caller is not the operator or the owner"
        );
        _;
    }

    /**
     * @dev Constructor initializes the ERC721 token with name "Familiars" and symbol "FMLRS"
     */
    constructor() ERC721("Familiars", "FMLRS") Ownable(_msgSender()) {
        operator = _msgSender();
        _nextTokenId = 1;
    }

    /**
     * @dev Safely mints a new token and sets initial properties
     * @param _to Address to receive the minted token
     * @param _uri The token URI containing metadata
     * @notice Only callable by contract operator
     */
    function safeMint(
        address _to,
        string memory _uri
    ) external onlyOperator(_msgSender()) returns (uint256) {
        uint256 tokenId = _nextTokenId;
        latestTokenId = tokenId;
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _uri);
        tokenHealth[tokenId] = 100;
        tokenLocation[tokenId] = FamiliarsLib.Location.HOME;
        _nextTokenId = tokenId + 1;
        return tokenId;
    }

    /**
     * @dev Change URI of the tokenid used for equip
     * @param _tokenId Address to receive the minted token
     * @param _uri The token URI containing metadata
     * @notice Only callable by contract operator or owner
     */
    function changeTokenURI(
        uint256 _tokenId,
        string memory _uri
    ) external onlyOperatorOrOwner {
        _setTokenURI(_tokenId, _uri);
    }

    /**
     * @dev Sets the health value for a specific token
     * @param _tokenId The ID of the token to modify
     * @param _health The new health value (0-50)
     * @notice Only callable by contract operator
     */
    function setHealth(
        uint256 _tokenId,
        uint8 _health
    ) external onlyOperator(_msgSender()) tokenExists(_tokenId) {
        require(_health > 0 && _health <= 100, "Health out of range");
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
     * @notice Only callable by contract operator
     */
    function goToLocation(
        uint256 _tokenId,
        FamiliarsLib.Location _location
    ) external onlyOperator(_msgSender()) tokenExists(_tokenId) {
        tokenLocation[_tokenId] = _location;
        emit FamiliarsLib.GoToLocation(_tokenId, locationToString(_location));
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
    ) external onlyOwner returns (FamiliarsLib.Requirements memory) {
        locationRequirements[_location] = _requirements;
        emit FamiliarsLib.SetLocationRequirements(_location, _requirements);
        return _requirements;
    }

    /**
     * @dev Gets the current location of a NPC
     * @param _tokenId The ID of the token to query
     * @return string The location name as a string
     */
    function getCurrentLocation(
        uint256 _tokenId
    )
        external
        view
        tokenExists(_tokenId)
        returns (string memory, FamiliarsLib.Location)
    {
        FamiliarsLib.Location _location = tokenLocation[_tokenId];
        return (locationToString(_location), _location);
    }

    /**
     * @dev Gets the current location of a NPC
     * @return _requirements The requirements for the location
     */
    function getLocationRequirements(
        FamiliarsLib.Location _location
    ) external view returns (FamiliarsLib.Requirements memory) {
        FamiliarsLib.Requirements memory _requirements = locationRequirements[
            _location
        ];
        return _requirements;
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
        // Define an array of location names corresponding to the enum values
        string[5] memory locationNames = [
            "Karmic Wellspring", // Assuming this is the first enum value
            "Karmic Tower",
            "Home",
            "Gathering Area",
            "Marketplace"
        ];

        // Convert the enum to its underlying integer value and return the corresponding string
        uint256 index = uint256(_location);
        if (index < locationNames.length) {
            return locationNames[index];
        }

        // Default case if the index is out of bounds
        return "Unknown Location";
    }

    /**
     * @dev Equip Items
     * @param _tokenId The token ID to equip items to
     * @param _mouthTokenId The token ID of the mouth item
     * @param _headTokenId The token ID of the head item
     * @param _tba The address of the token balance account
     * @param _familiarItems The address of the ERC1155 contract for items
     * @notice Only callable by contract Operator
     */
    function equipItem(
        uint256 _tokenId,
        uint256 _mouthTokenId,
        uint256 _headTokenId,
        address _tba,
        address _familiarItems
    ) external onlyOperator(_msgSender()) tokenExists(_tokenId) {
        require(
            _mouthTokenId != _headTokenId,
            "Mouth and head equippable nft should not equal."
        );
        IERC1155 items = IERC1155(_familiarItems);
        uint256 headBal = items.balanceOf(_tba, _headTokenId);
        uint256 mouthBal = items.balanceOf(_tba, _mouthTokenId);

        // Initialize equipped items
        FamiliarsLib.EquipItems memory newEquippedItems = FamiliarsLib
            .EquipItems({mouth: 0, head: 0});

        // Equip mouth item if balance is greater than 0
        if (mouthBal > 0) {
            newEquippedItems.mouth = _mouthTokenId;
        }

        // Equip head item if balance is greater than 0
        if (headBal > 0) {
            newEquippedItems.head = _headTokenId;
        }

        // Store the equipped items in the mapping
        equippedItem[_tokenId] = newEquippedItems;
    }

    /**
     * @dev Retrieves the equipped items for a given token ID.
     * @param _tokenId The token ID for which to retrieve equipped items.
     * @return A struct containing the equipped mouth and head item IDs.
     * @notice This function can only be called if the token exists.
     */
    function getEquippedItems(
        uint256 _tokenId
    )
        external
        view
        tokenExists(_tokenId)
        returns (FamiliarsLib.EquipItems memory)
    {
        FamiliarsLib.EquipItems memory _equippedItems = equippedItem[_tokenId];
        return _equippedItems;
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
