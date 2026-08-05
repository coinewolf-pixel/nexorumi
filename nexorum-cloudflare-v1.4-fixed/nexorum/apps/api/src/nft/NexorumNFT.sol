// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NexorumNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public constant PLATFORM_FEE = 250; // 2.5%
    uint256 public constant MAX_FEE = 10000;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    struct Offer {
        address buyer;
        uint256 price;
        uint256 expiresAt;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer[]) public offers;
    mapping(uint256 => uint256) public royaltyRates; // basis points
    mapping(uint256 => address) public creators;

    uint256 private _tokenIdCounter;
    address public platformWallet;

    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ItemDelisted(uint256 indexed tokenId);
    event OfferMade(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event OfferAccepted(uint256 indexed tokenId, uint256 offerIndex);

    constructor(address _platformWallet) ERC721("NEXORUM Items", "NEXOITEM") Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }

    function mint(address to, string memory uri, uint256 royaltyRate) external returns (uint256) {
        require(royaltyRate <= 1000, "Royalty max 10%");
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        creators[tokenId] = msg.sender;
        royaltyRates[tokenId] = royaltyRate;
        return tokenId;
    }

    function listItem(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price > 0");
        require(getApproved(tokenId) == address(this) || isApprovedForAll(ownerOf(tokenId), address(this)), "Not approved");

        listings[tokenId] = Listing(msg.sender, price, true);
        emit ItemListed(tokenId, msg.sender, price);
    }

    function delistItem(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        listings[tokenId].active = false;
        emit ItemDelisted(tokenId);
    }

    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Calculate fees
        uint256 platformFee = (price * PLATFORM_FEE) / MAX_FEE;
        uint256 royaltyFee = (price * royaltyRates[tokenId]) / MAX_FEE;
        uint256 sellerProceeds = price - platformFee - royaltyFee;

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        listings[tokenId].active = false;

        // Distribute funds
        payable(platformWallet).transfer(platformFee);
        if (royaltyFee > 0) payable(creators[tokenId]).transfer(royaltyFee);
        payable(seller).transfer(sellerProceeds);

        // Refund excess
        if (msg.value > price) payable(msg.sender).transfer(msg.value - price);

        emit ItemSold(tokenId, msg.sender, price);
    }

    function makeOffer(uint256 tokenId) external payable {
        require(msg.value > 0, "Offer > 0");
        offers[tokenId].push(Offer(msg.sender, msg.value, block.timestamp + 7 days));
        emit OfferMade(tokenId, msg.sender, msg.value);
    }

    function acceptOffer(uint256 tokenId, uint256 offerIndex) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Offer memory offer = offers[tokenId][offerIndex];
        require(block.timestamp < offer.expiresAt, "Offer expired");

        uint256 price = offer.price;
        uint256 platformFee = (price * PLATFORM_FEE) / MAX_FEE;
        uint256 royaltyFee = (price * royaltyRates[tokenId]) / MAX_FEE;
        uint256 sellerProceeds = price - platformFee - royaltyFee;

        _transfer(msg.sender, offer.buyer, tokenId);
        listings[tokenId].active = false;

        payable(platformWallet).transfer(platformFee);
        if (royaltyFee > 0) payable(creators[tokenId]).transfer(royaltyFee);
        payable(msg.sender).transfer(sellerProceeds);

        // Remove offer
        offers[tokenId][offerIndex] = offers[tokenId][offers[tokenId].length - 1];
        offers[tokenId].pop();

        emit OfferAccepted(tokenId, offerIndex);
    }

    function cancelOffer(uint256 tokenId, uint256 offerIndex) external {
        Offer memory offer = offers[tokenId][offerIndex];
        require(offer.buyer == msg.sender, "Not offerer");
        payable(msg.sender).transfer(offer.price);
        offers[tokenId][offerIndex] = offers[tokenId][offers[tokenId].length - 1];
        offers[tokenId].pop();
    }

    function getActiveListings(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        uint256 count = 0;
        uint256[] memory temp = new uint256[](limit);

        for (uint256 i = offset; i < total && count < limit; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (listings[tokenId].active) {
                temp[count++] = tokenId;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) result[i] = temp[i];
        return result;
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
