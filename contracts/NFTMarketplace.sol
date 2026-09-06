// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract NFTMarketplace is Ownable,ERC721URIStorage{

    using Counters for Counters.Counter;

    uint256 listPrice=0.01 ether;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    mapping(uint256=>ListedToken) private idToListedToken;

    struct ListedToken{

        uint256 tokenId;
        address payable  owner;
        address payable  seller;
        uint256 price;
        bool curentlyListed;

    }

    event TokenListedSuccess( 
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed);

    constructor() Ownable() ERC721("NFTMarketplace","NFTM"){

    }

    //owner
    
    function updateListPrice(uint256 _listPrice) external onlyOwner{
        listPrice=_listPrice;
    }

    //seller

    function createToken(string memory tokenURI, uint256 price) payable  external returns(uint256){
        //price>0
        require(price>0,"price must greater than zero");
        //msg.value=listPrice
        require(msg.value==listPrice,"need send enough list price");
        //mint
        _tokenIds.increment();
        uint256 newTokenId=_tokenIds.current();
        _safeMint(msg.sender,newTokenId);
        _setTokenURI(newTokenId,tokenURI);
        //create listToken
        idToListedToken[newTokenId]=ListedToken(newTokenId,payable (address(this)),payable (msg.sender),price,true);
        //transfer token->market
        _transfer(msg.sender,address(this),newTokenId);
        //emit event
        emit TokenListedSuccess(newTokenId,address(this),msg.sender,price,true);
        return _tokenIds.current();
    }




    //buyers

    function executeSale(uint256 tokenId) payable external  {
        //tokenId is listed
        ListedToken storage token=idToListedToken[tokenId];
        require(token.curentlyListed,"nft must listed");
        //msg.value=price;
        require(msg.value==token.price,"price not enough");

        address payable seller=token.seller;
        //change owner
        token.seller=payable(msg.sender);
    
        //transfer nft->msg.sender
        _transfer(address(this),msg.sender,tokenId);

        //price->seller
        seller.transfer(token.price);
        //listprice->owner
        payable(owner()).transfer(listPrice);

        _itemsSold.increment();

    }


    //extend

    function getAllNFTs() external view returns (ListedToken[] memory){
        uint totalTokens=_tokenIds.current();
        ListedToken[] memory _listedTokens=new ListedToken[](totalTokens);
        for(uint i=0;i<totalTokens;i++){
            _listedTokens[i]=idToListedToken[i+1];
        }
        return _listedTokens;
    }

    function getMyNFTs() external view  returns(ListedToken[] memory){
         uint totalTokens=_tokenIds.current();
         uint myTokensCount=0;
        for(uint i=0;i<totalTokens;i++){
            if(idToListedToken[i+1].owner==msg.sender||idToListedToken[i+1].seller==msg.sender){
                myTokensCount+=1;
            }
        }
         ListedToken[] memory _listedTokens=new ListedToken[](myTokensCount);
         
         uint256 currentIndex=0;
        for(uint i=0;i<totalTokens;i++){
            if(idToListedToken[i+1].owner==msg.sender||idToListedToken[i+1].seller==msg.sender){
                _listedTokens[currentIndex]=idToListedToken[i+1];
                currentIndex+=1;
            }
        }

        return _listedTokens;
         

    }


    function getLatestIdToListedToken() external view  returns(uint256){
        return _tokenIds.current();

    }

    function getListedTokenForId(uint256 _tokenId) external view  returns(ListedToken memory){
         return   idToListedToken[_tokenId];

    }

    function getCurrentToken() external  view returns(ListedToken memory){
      return   idToListedToken[_tokenIds.current()];
    }

    function getListPrice() external view  returns(uint256){
        return listPrice;
    }

    receive() external payable {
        console.log("fallback");
        //fallback
    }

}

