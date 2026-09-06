const { ethers } = require("hardhat");
const fs = require("fs");
const { expect } = require("chai");

async function deploy() {
  const _contract = await ethers.getContractFactory("NFTMarketplace");
  const _nftMarket = await _contract.deploy();
  await _nftMarket.deployed();
  expect(await _nftMarket.getListPrice()).eq(ethers.utils.parseEther("0.01"));
  const data = {
    address: _nftMarket.address,
    abi: JSON.parse(_nftMarket.interface.format("json")),
  };
  fs.writeFileSync("./src/Marketplace.json", JSON.stringify(data));
  console.log(_nftMarket.address);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
