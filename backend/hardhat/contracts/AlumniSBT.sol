// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal Soulbound Token-like contract (no ERC721 inheritance) that stores document hashes and mints
// non-transferable token records. This simplified contract avoids external dependencies and is intended
// for development and testing. For production use, replace with a full ERC721-based SBT implementation.

contract AlumniSBT {
    address public owner;
    uint256 private _tokenIds;

    mapping(bytes32 => bool) public documentHashExists;
    mapping(uint256 => address) public tokenOwner;
    mapping(uint256 => string) public tokenUri;

    event DocumentHashStored(bytes32 indexed docHash);
    event SbtMinted(address indexed to, uint256 tokenId, bytes32 indexed docHash);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function storeDocumentHash(bytes32 docHash) external onlyOwner {
        require(!documentHashExists[docHash], "Document hash already exists");
        documentHashExists[docHash] = true;
        emit DocumentHashStored(docHash);
    }

    function isDocumentHashStored(bytes32 docHash) external view returns (bool) {
        return documentHashExists[docHash];
    }

    function mintSBT(address to, string memory _tokenUri, bytes32 docHash) external onlyOwner returns (uint256) {
        require(documentHashExists[docHash], "Document hash not stored");
        _tokenIds += 1;
        uint256 newId = _tokenIds;
        tokenOwner[newId] = to;
        tokenUri[newId] = _tokenUri;
        emit SbtMinted(to, newId, docHash);
        return newId;
    }
}
