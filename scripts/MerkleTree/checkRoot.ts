import { ethers } from "hardhat";

async function main() {
  const airdropAddress = "0x892b982ab76e8B732C83482b7EeeA00F05F7ac91"; // replace bằng address airdrop
  const airdrop = await ethers.getContractAt("airdrop", airdropAddress);

  const root = await airdrop.merkleRoot();
  console.log("Merkle Root in contract:", root);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
