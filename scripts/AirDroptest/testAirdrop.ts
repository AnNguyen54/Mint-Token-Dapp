import { ethers, network } from "hardhat";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🧪 Testing on network:", network.name);
  console.log("Deployer address:", deployer.address);

  // Thay bằng address deploy token & airdrop của bạn
  const tokenAddress = "0x3612157aB2138Da5271EFA8a7fEc1f6edd3e5ca6";
  const airdropAddress = "0x892b982ab76e8B732C83482b7EeeA00F05F7ac91";

  const token = await ethers.getContractAt("MyMintableToken", tokenAddress);
  const airdrop = await ethers.getContractAt("airdrop", airdropAddress);

  console.log("✅ Connected to token:", tokenAddress);
  console.log("✅ Connected to airdrop:", airdropAddress);

  // Load proofs
  let proofs;
  try {
    proofs = JSON.parse(fs.readFileSync("merkle-proofs.json", "utf8"));
  } catch {
    console.log("⚠️ No merkle-proofs.json found, skipping claim test");
    return;
  }

  // Chỉ lấy proof của deployer
  const proofData = proofs[deployer.address] || proofs[deployer.address.toLowerCase()];
  if (!proofData) {
    console.log("⚠️ Deployer address not in whitelist");
    return;
  }

  console.log(`\n⏳ Testing claim for deployer: ${deployer.address}`);
  console.log("Amount:", proofData.amount);

  try {
    const claimTx = await airdrop.connect(deployer).claim(proofData.amount, proofData.proof);
    await claimTx.wait();
    console.log("✅ Claim successful for deployer");

    const balance = await token.balanceOf(deployer.address);
    console.log("Token balance:", balance.toString());
  } catch (err: any) {
    console.log("❌ Claim failed:", err.reason || err.message);
  }

  const totalSupply = await token.totalSupply();
  console.log("\n📊 Total token supply:", totalSupply.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
