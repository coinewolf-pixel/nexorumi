// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NexorumNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {

    struct Listing {
        address seller;
        uint256 price;      // in wei
        bool active;
    }

    struct Item {
        uint256 tokenId;
        string itemType;    // 'skin' | 'weapon' | 'armor' | 'cosmetic'
        string rarity;      // 'common' to 'primordial'
        uint256 power;
        string marketId;    // 'hunt', 'racing', etc.
    }

    uint256 private _tokenIdCounter;
    uint256 public platformFeePercent = 250; // 2.5% = 250 basis points
    address public platformWallet;

    mapping(uint256 => Item) public items;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;

    event ItemMinted(uint256 indexed tokenId, address indexed owner, string itemType, string rarity);
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ItemDelisted(uint256 indexed tokenId, address indexed seller);
    event FeeUpdated(uint256 newFeePercent);

    constructor(address _platformWallet) ERC721("NEXORUM Items", "NEXOITEM") {
        platformWallet = _platformWallet;
        _tokenIdCounter = 1;
    }

    function mintItem(
        address to,
        string memory uri,
        string memory itemType,
        string memory rarity,
        uint256 power,
        string memory marketId
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        items[tokenId] = Item(tokenId, itemType, rarity, power, marketId);

        emit ItemMinted(tokenId, to, itemType, rarity);
        return tokenId;
    }

    function listItem(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        require(!listings[tokenId].active, "Already listed");

        listings[tokenId] = Listing(msg.sender, price, true);

        emit ItemListed(tokenId, msg.sender, price);
    }

    function delistItem(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        require(listings[tokenId].active, "Not listed");

        listings[tokenId].active = false;

        emit ItemDelisted(tokenId, msg.sender);
    }

    function buyItem(uint256 tokenId) public payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(ownerOf(tokenId) == listing.seller, "Seller no longer owns");

        uint256 platformFee = (listing.price * platformFeePercent) / 10000;
        uint256 sellerProceeds = listing.price - platformFee;

        // Transfer NFT
        _transfer(listing.seller, msg.sender, tokenId);

        // Handle payments
        pendingWithdrawals[listing.seller] += sellerProceeds;
        pendingWithdrawals[platformWallet] += platformFee;

        // Refund excess
        if (msg.value > listing.price) {
            pendingWithdrawals[msg.sender] += (msg.value - listing.price);
        }

        listings[tokenId].active = false;

        emit ItemSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    function withdraw() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function updatePlatformFee(uint256 newFeePercent) public onlyOwner {
        require(newFeePercent <= 1000, "Fee too high"); // max 10%
        platformFeePercent = newFeePercent;
        emit FeeUpdated(newFeePercent);
    }

    function updatePlatformWallet(address newWallet) public onlyOwner {
        platformWallet = newWallet;
    }

    function getActiveListings() public view returns (uint256[] memory) {
        uint256 total = totalSupply();
        uint256[] memory temp = new uint256[](total);
        uint256 count = 0;

        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (listings[i].active) {
                temp[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        return result;
    }

    function getItemsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory result = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            result[i] = tokenOfOwnerByIndex(owner, i);
        }
        return result;
    }

    // Required overrides
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Auto-delist on transfer
        if (listings[tokenId].active) {
            listings[tokenId].active = false;
        }
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
