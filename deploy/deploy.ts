import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  try {
    console.log("Starting deployment...\n");

    // 1. Get deployer info
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    // 2. Read merkle root
    const rootJson = JSON.parse(fs.readFileSync("merkle-root.json", "utf8"));
    const root = rootJson.root;
    console.log("Merkle Root:", root, "\n");

    // 3. Deploy Token
    console.log("Deploying MyMintableToken...");
    const Token = await ethers.getContractFactory("MyMintableToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed to:", tokenAddress);

    // 4. Deploy Airdrop
    console.log("\nDeploying Airdrop contract...");
    const Airdrop = await ethers.getContractFactory("airdrop");
    const airdrop = await Airdrop.deploy(tokenAddress, root);
    await airdrop.waitForDeployment();
    const airdropAddress = await airdrop.getAddress();
    console.log("Airdrop deployed to:", airdropAddress);

    // 5. Transfer ownership
    console.log("\nTransferring ownership to Airdrop...");
    const tx = await token.transferOwnership(airdropAddress);
    await tx.wait(); // Đợi transaction confirm
    console.log("Ownership transferred!");

    // 6. Verify ownership (optional but good practice)
    const newOwner = await token.owner();
    if (newOwner !== airdropAddress) {
      throw new Error("Ownership transfer failed!");
    }
    console.log("Verified: Token owner is", newOwner);

    // 7. Save deployment info
    const network = await ethers.provider.getNetwork();
    const deploymentInfo = {
      network: network.name,
      chainId: Number(network.chainId),
      token: tokenAddress,
      airdrop: airdropAddress,
      merkleRoot: root,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };

    fs.writeFileSync(
      "deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );

    // 8. Summary
    console.log("\n" + "=".repeat(60));
    console.log("Deployment Summary");
    console.log("=".repeat(60));
    console.log(`Network:         ${network.name}`);
    console.log(`Chain ID:        ${network.chainId}`);
    console.log(`Token:           ${tokenAddress}`);
    console.log(`Airdrop:         ${airdropAddress}`);
    console.log(`Merkle Root:     ${root}`);
    console.log(`Deployer:        ${deployer.address}`);
    console.log("=".repeat(60));

    console.log("\nDeployment info saved to deployment-info.json");

    // 9. Verification commands (if on testnet/mainnet)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\nTo verify on Etherscan:");
      console.log("=".repeat(60));
      console.log(`npx hardhat verify --network ${network.name} ${tokenAddress}`);
      console.log(`npx hardhat verify --network ${network.name} ${airdropAddress} "${tokenAddress}" "${root}"`);
      console.log("=".repeat(60));
    }

  } catch (error) {
    console.error("\nDeployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });