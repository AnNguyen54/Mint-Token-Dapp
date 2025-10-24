import { ethers, upgrades } from "hardhat";

async function main() {
    const proxyAddress = "0x892b982ab76e8B732C83482b7EeeA00F05F7ac91"; // proxy hiện tại

    const Airdrop = await ethers.getContractFactory("airdrop");

    // Import proxy cũ
    await upgrades.forceImport(proxyAddress, Airdrop);

    console.log("Proxy đã được import thành công!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
