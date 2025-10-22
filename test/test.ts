import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Testing Airdrop Claim...\n");

  // 1. Load deployment info
  const deploymentInfo = JSON.parse(
    fs.readFileSync("deployment-info.json", "utf8")
  );

  const tokenAddress = deploymentInfo.token;
  const airdropAddress = deploymentInfo.airdrop;

  console.log("Contract Addresses:");
  console.log("Token:", tokenAddress);
  console.log("Airdrop:", airdropAddress);
  console.log("=".repeat(60), "\n");

  // 2. Get contracts
  const token = await ethers.getContractAt("MyMintableToken", tokenAddress);
  const airdrop = await ethers.getContractAt("airdrop", airdropAddress);

  // 3. Load proofs
  const proofs = JSON.parse(fs.readFileSync("merkle-proofs.json", "utf8"));
  const addresses = Object.keys(proofs);

  console.log(` Total whitelist addresses: ${addresses.length}\n`);

  // 4. Test first address
  //const testAddress = addresses[0];
  const testAddress = addresses[2];
  const proofData = proofs[testAddress];

  console.log(" Testing Address:", testAddress);
  console.log("Amount to claim:", proofData.amount);

  // 5. Check if already claimed
  const hasClaimed = await airdrop.claimed(testAddress);
  console.log("Already claimed:", hasClaimed);

  if (hasClaimed) {
    console.log("\nThis address already claimed!");
    
    // Check balance
    const balance = await token.balanceOf(testAddress);
    console.log("Current balance:", balance.toString());
    
    return;
  }

  // 6. Impersonate account to test claim
  try {
    console.log("\n Attempting to claim...");

    // Impersonate the address
    await ethers.provider.send("hardhat_impersonateAccount", [testAddress]);
    const testSigner = await ethers.getSigner(testAddress);

    // Fund with ETH for gas
    const [deployer] = await ethers.getSigners();
    await deployer.sendTransaction({
      to: testAddress,
      value: ethers.parseEther("1.0"),
    });
    console.log(" Funded test address with 1 ETH for gas");

    // Connect airdrop contract with test signer
    const airdropWithSigner = airdrop.connect(testSigner);

    // Claim tokens
    const tx = await airdropWithSigner.claim(
      proofData.amount,
      proofData.proof
    );
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log(" Claim successful!");
    console.log("Gas used:", receipt?.gasUsed.toString());

    // Check balance after claim
    const balance = await token.balanceOf(testAddress);
    console.log("New balance:", balance.toString());

    // Check claimed status
    const nowClaimed = await airdrop.claimed(testAddress);
    console.log("Claimed status:", nowClaimed);

    // Stop impersonating
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [
      testAddress,
    ]);

    console.log("\n Test completed successfully!");
  } catch (error: any) {
    console.error("\n Test failed:", error.message);
  }

  // 7. Check overall stats
  console.log("\n" + "=".repeat(60));
  console.log(" Overall Stats:");
  console.log("=".repeat(60));

  let totalClaimed = 0;
  let totalAmount = 0n;

  for (const address of addresses.slice(0, 20)) {
    // Check first 5
    const claimed = await airdrop.claimed(address);
    const balance = await token.balanceOf(address);

    if (claimed) totalClaimed++;
    totalAmount += BigInt(proofs[address].amount);

    console.log(
      `${address.slice(0, 10)}... | Claimed: ${claimed ? "✅" : "❌"} | Balance: ${balance.toString()}`
    );
  }

  console.log("=".repeat(60));
  console.log(`Claimed: ${totalClaimed}/${addresses.length}`);

  const totalSupply = await token.totalSupply();
  console.log(`Total Supply: ${totalSupply.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });