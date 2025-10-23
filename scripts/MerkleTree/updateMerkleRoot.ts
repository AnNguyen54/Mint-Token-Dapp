// scripts/updateMerkleRoot.ts
import fs from "fs";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

// Types
interface WhitelistEntry {
  address: string;
  amount: string;
}

interface ProofData {
  amount: string;
  proof: string[];
}

interface ProofsMap {
  [address: string]: ProofData;
}

// --- 1️⃣ Load whitelist mới ---
const whitelist: WhitelistEntry[] = JSON.parse(
  fs.readFileSync("whitelist.json", "utf8")
);

// --- 2️⃣ Create leaf nodes ---
function createLeaf(address: string, amount: string): string {
  return ethers.solidityPackedKeccak256(["address", "uint256"], [address, amount]);
}

// --- 3️⃣ Hash pair helper ---
function hashPair(a: string, b: string): string {
  const sorted = [a, b].sort();
  return ethers.keccak256(ethers.concat(sorted));
}

// --- 4️⃣ Build Merkle Tree ---
function buildMerkleTree(leaves: string[]): string[][] {
  let currentLevel: string[] = [...leaves];
  const tree: string[][] = [currentLevel];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return tree;
}

// --- 5️⃣ Generate proof for a leaf ---
function generateProof(tree: string[][], leafIndex: number): string[] {
  const proof: string[] = [];
  let currentIndex = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const currentLevel = tree[level];
    const isRightNode = currentIndex % 2 === 1;
    const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

    if (siblingIndex < currentLevel.length) {
      proof.push(currentLevel[siblingIndex]);
    }

    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}

// --- 6️⃣ Build tree & generate proofs ---
const leaves = whitelist.map(item => createLeaf(item.address, item.amount));
const tree = buildMerkleTree(leaves);
const root = tree[tree.length - 1][0];

const proofs: ProofsMap = {};
whitelist.forEach((item, index) => {
  proofs[item.address] = {
    amount: item.amount,
    proof: generateProof(tree, index)
  };
});

// --- 7️⃣ Save files ---
fs.writeFileSync("merkle-root.json", JSON.stringify({ root }, null, 2));
fs.writeFileSync("merkle-proofs.json", JSON.stringify(proofs, null, 2));

console.log("Merkle Root:", root);
console.log(`Generated proofs for ${Object.keys(proofs).length} addresses`);
console.log("Files generated: merkle-root.json, merkle-proofs.json");

// --- 8️⃣ Update root trên contract ---
async function updateRoot() {
  const [deployer] = await ethers.getSigners();
  console.log("Updating root with account:", deployer.address);

  const airdropAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // <-- update
  const airdrop = await ethers.getContractAt("airdrop", airdropAddress);

  const tx = await airdrop.connect(deployer).setMerkleRoot(root);
  await tx.wait();

  console.log("Merkle root updated successfully on contract!");
}

updateRoot().catch(err => {
  console.error(err);
  process.exit(1);
});
