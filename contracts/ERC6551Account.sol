// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "./interfaces/IERC6551Account.sol";
import "./interfaces/IERC6551Executable.sol";

contract ERC6551Account is
    IERC165,
    IERC1271,
    IERC6551Account,
    ERC1155Holder,
    ERC721Holder,
    IERC6551Executable
{
    uint256 public state;

    // Events
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);
    event TokenReceived(address indexed token, uint256 value, uint256 tokenId);
    event ERC20Received(address indexed token, uint256 amount);

    receive() external payable {
        emit TokenReceived(address(0), msg.value, 0);
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 operation
    ) public payable virtual returns (bytes memory result) {
        require(_isValidSigner(msg.sender), "Invalid signer");
        require(operation == 0, "Only call operations are supported");
        require(to != address(0), "Invalid target address");

        ++state;

        bool success;
        (success, result) = to.call{value: value}(data);

        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }

        emit ExecutionSuccess(to, value, data);
    }

    function isValidSigner(
        address signer,
        bytes calldata
    ) public view virtual returns (bytes4) {
        if (_isValidSigner(signer)) {
            return IERC6551Account.isValidSigner.selector;
        }

        return bytes4(0);
    }

    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) public view virtual returns (bytes4 magicValue) {
        bool isValid = SignatureChecker.isValidSignatureNow(
            owner(),
            hash,
            signature
        );

        if (isValid) {
            return IERC1271.isValidSignature.selector;
        }

        return "";
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public pure virtual override(ERC1155Holder, IERC165) returns (bool) {
        return (interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId ||
            interfaceId == type(IERC6551Executable).interfaceId ||
            interfaceId == type(ERC721Holder).interfaceId ||
            interfaceId == type(ERC1155Holder).interfaceId);
    }

    function token() public view virtual returns (uint256, address, uint256) {
        bytes memory footer = new bytes(0x60);

        assembly {
            extcodecopy(address(), add(footer, 0x20), 0x4d, 0x60)
        }

        return abi.decode(footer, (uint256, address, uint256));
    }

    function owner() public view virtual returns (address) {
        (uint256 chainId, address tokenContract, uint256 tokenId) = token();
        if (chainId != block.chainid) return address(0);

        return IERC721(tokenContract).ownerOf(tokenId);
    }

    function _isValidSigner(
        address signer
    ) internal view virtual returns (bool) {
        return signer == owner();
    }

    // Function to get the contract's ETH balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
