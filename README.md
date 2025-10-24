Hướng dẫn nhanh để mint token và test airdrop


## Setup (

# Clone và install
git clone <repo>
cd "Mint Token Dapp"
npm install

# Install thêm dependencies
npm install --save-dev @openzeppelin/hardhat-upgrades
```

---

 Mint Token

### Bước 1: Tạo Whitelist 

Tạo file `whitelist.json`:

```json
[
  { "address": "0x0000000000000000000000000000000000000000", "amount": "1000" },
  { "address": "0x0000000000000000000000000000000000000000", "amount": "1200" },
  { "address": "0x0000000000000000000000000000000000000000", "amount": "1400" }
]
```

### Bước 2: Generate Merkle Tree 

```bash
npx ts-node scripts/MerkleTree/generateTree.ts
```
Tạo ra: `merkle-root.json` và `merkle-proofs.json`

### Bước 3: Deploy Contracts


Sepolia
**Terminal:**
```bash
npx hardhat deploy --network sepolia
```
Copy addresses từ output:
```
Token: 0xa000000000000000000000000000000000000000
Airdrop: 0x0000000000000000000000000000000000000000
```

### Bước 4: Test Claim 

```bash
npx hardhat run scripts/AirDroptest/testAirdrop --network sepolia
```

✅ Xem kết quả claim thành công!

Nếu address trong whitelist.json đã claim rồi thì sẽ báo ❌ Claim failed: execution reverted: Already claimed

---

## 🎯 Các Lệnh Quan Trọng

```bash
# Generate merkle tree
npx ts-node scripts/MerkleTree/generateTree.ts

# Compile contracts
npx hardhat compile

# Deploy sepolia
npx hardhat deploy --network sepolia

# Test đơn giản
npx hardhat run scripts/AirDroptest/testAirdrop --network sepolia

```

---





```

---

