import { ethers } from 'ethers';
import * as fs from 'fs';

// Define types
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

// Read whitelist from file
const whitelist: WhitelistEntry[] = JSON.parse(
  fs.readFileSync('whitelist.json', 'utf8')
);

// Create leaf nodes (hash of address and amount)
function createLeaf(address: string, amount: string): string {
  return ethers.solidityPackedKeccak256(
    ['address', 'uint256'],
    [address, amount]
  );
}

// Sort and hash pair
function hashPair(a: string, b: string): string {
  const sorted = [a, b].sort();
  return ethers.keccak256(ethers.concat(sorted));
}

// Generate leaves
const leaves: string[] = whitelist.map(item => 
  createLeaf(item.address, item.amount)
);

// Build Merkle Tree
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

// Generate proof for a specific leaf
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

// Build tree
const tree: string[][] = buildMerkleTree(leaves);
const root: string = tree[tree.length - 1][0];

// Generate proofs for all addresses
const proofs: ProofsMap = {};
whitelist.forEach((item, index) => {
  proofs[item.address] = {
    amount: item.amount,
    proof: generateProof(tree, index)
  };
});

// Write root to separate file
fs.writeFileSync('merkle-root.json', JSON.stringify({ root }, null, 2));

// Write proofs to separate file
fs.writeFileSync('merkle-proofs.json', JSON.stringify(proofs, null, 2));

// Also log to console
console.log('Merkle Root:', root);
console.log('\nGenerated proofs for', Object.keys(proofs).length, 'addresses');
console.log('\nFiles generated:');
console.log('  - merkle-root.json');
console.log('  - merkle-proofs.json');
console.log('\nSample proof:');
console.log(JSON.stringify({
  [whitelist[0].address]: proofs[whitelist[0].address]
}, null, 2));