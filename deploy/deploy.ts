import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const rootJson = JSON.parse(fs.readFileSync("merkle-root.json", "utf8"));
  const root = rootJson.root;

  // Deploy Token
  const Token = await ethers.getContractFactory("MyMintableToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());

  //Deploy Airdrop, truyền địa chỉ token + root
  const Airdrop = await ethers.getContractFactory("airdrop");
  const airdrop = await Airdrop.deploy(await token.getAddress(), root);
  await airdrop.waitForDeployment();
  console.log("Airdrop deployed to:", await airdrop.getAddress());

  // cho phép Airdrop contract được mint token
  await token.transferOwnership(await airdrop.getAddress());
  console.log("Ownership transferred to Airdrop contract");
}

main().catch(console.error);
