const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket_Normal", function () {
  let nftMarket;
  beforeEach(async function () {
    const contract = await ethers.getContractFactory("NFTMarketplace");
    nftMarket = await contract.deploy();
    await nftMarket.deployed();
  });
  it("create token return tokenId ", async function () {
    const listPrice = await nftMarket.getListPrice();
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    expect(await nftMarket.getLatestIdToListedToken()).eq(1);
  });
  it("create token tokenId increment ", async function () {
    const listPrice = await nftMarket.getListPrice();
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    expect(await nftMarket.getLatestIdToListedToken()).eq(1);
    await nftMarket.createToken("/uri", 4, {
      value: listPrice,
    });
    expect(await nftMarket.getLatestIdToListedToken()).eq(2);
  });

  it("execuate sale token  ", async function () {
    const [signer1, signer2] = await ethers.getSigners();
    let listPrice = await nftMarket.getListPrice();
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    expect(await nftMarket.getLatestIdToListedToken()).eq(1);

    let listToken = await nftMarket.getListedTokenForId(1);

    expect(listToken.seller).eq(signer1.address);
    expect(await listToken.owner).eq(nftMarket.address);
    expect(await nftMarket.ownerOf(1)).eq(nftMarket.address);

    await nftMarket.connect(signer2).executeSale(1, { value: listToken.price });
    listToken = await nftMarket.getListedTokenForId(1);
    expect(listToken.seller).eq(signer2.address);
    expect(await listToken.owner).eq(nftMarket.address);
    expect(await nftMarket.ownerOf(1)).eq(signer2.address);
  });
});

describe("NFTMarket_Exception", function () {
  let nftMarket;
  beforeEach(async function () {
    const contract = await ethers.getContractFactory("NFTMarketplace");
    nftMarket = await contract.deploy();
    await nftMarket.deployed();
  });
  it("create token list price error ", async function () {
    await expect(nftMarket.createToken("/uri", 5)).revertedWith(
      "need send enough list price"
    );
  });
  it("create token token price error ", async function () {
    await expect(nftMarket.createToken("/uri", 0)).revertedWith(
      "price must greater than zero"
    );
  });
  it("excute sale price is not enough ", async function () {
    const [signer1, signer2] = await ethers.getSigners();
    let listPrice = await nftMarket.getListPrice();
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    expect(await nftMarket.getLatestIdToListedToken()).eq(1);

    let listToken = await nftMarket.getListedTokenForId(1);

    await expect(nftMarket.connect(signer2).executeSale(1)).revertedWith(
      "price not enough"
    );
  });
});
describe("NFTMarket_HELPER", function () {
  let nftMarket;
  beforeEach(async function () {
    const contract = await ethers.getContractFactory("NFTMarketplace");
    nftMarket = await contract.deploy();
    await nftMarket.deployed();
  });
  it("list All", async function () {
    const listPrice = await nftMarket.getListPrice();
    const [signer1, signer2] = await ethers.getSigners();
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    await nftMarket.connect(signer2).createToken("/uri", 5, {
      value: listPrice,
    });
    const allNfts = await nftMarket.getAllNFTs();
    expect(allNfts.length).eq(2);
  });
  it("list My token", async function () {
    const listPrice = await nftMarket.getListPrice();
    const [signer1, signer2] = await ethers.getSigners();
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    await nftMarket.createToken("/uri", 5, {
      value: listPrice,
    });
    await nftMarket.connect(signer2).createToken("/uri", 5, {
      value: listPrice,
    });
    let allNfts = await nftMarket.getMyNFTs();
    expect(allNfts.length).eq(2);
    allNfts = await nftMarket.connect(signer2).getMyNFTs();
    expect(allNfts.length).eq(1);
  });
});
