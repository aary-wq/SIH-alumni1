// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Simple Soulbound Token that is non-transferable
contract AlumniSBT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    // mapping of document hash => issued (bool)
    mapping(bytes32 => bool) public documentHashExists;

    event DocumentHashStored(bytes32 indexed docHash);
    event SbtMinted(address indexed to, uint256 tokenId, bytes32 indexed docHash);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    // Admin stores document hash on chain
    function storeDocumentHash(bytes32 docHash) external onlyOwner {
        require(!documentHashExists[docHash], "Document hash already exists");
        documentHashExists[docHash] = true;
        emit DocumentHashStored(docHash);
    }

    // Check if document hash is stored
    function isDocumentHashStored(bytes32 docHash) external view returns (bool) {
        return documentHashExists[docHash];
    }

    // Mint SBT - only owner (admin) can mint
    function mintSBT(address to, string memory tokenUri, bytes32 docHash) external onlyOwner returns (uint256) {
        require(documentHashExists[docHash], "Document hash not stored");
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _safeMint(to, newItemId);
        _setTokenURI(newItemId, tokenUri);
        emit SbtMinted(to, newItemId, docHash);
        return newItemId;
    }

    // Override transfer functions to prevent transfers (soulbound)
    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        revert("SBT: Transfers are disabled");
    }

    function approve(address to, uint256 tokenId) public virtual override {
        revert("SBT: Approvals are disabled");
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        revert("SBT: Approvals are disabled");
    }
}
