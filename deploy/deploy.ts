import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import fs from 'fs';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log(hre.network.name);
  console.log("====================");

  console.log("====================");
  console.log("Deploy MyMintableToken Contract");
  console.log("====================");

  const tokenDeployment = await deploy("MyMintableToken", {
    contract: "MyMintableToken",
    args: [], 
    from: deployer,
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: false,
  });

  const tokenAddress = tokenDeployment.address;
  console.log("\nMyMintToken deployed at:", tokenAddress);

  // Load merkle root
  const rootPath = 'merkle-root.json';
  const rootData = fs.readFileSync(rootPath, 'utf8');
  const merkleRoot = JSON.parse(rootData).root;

  const airdropDeployment = await deploy("airdrop", {
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: [ // tham số constructor của mình là gì truyền vô
            tokenAddress,
            merkleRoot, 
          ],
        },
        onUpgrade:{
          methodName: "setUpgradeAmount",
          args:[0],
        }
      },
    },
    contract: "airdrop",
    from: deployer,
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: false,
  });

  const airdropAddress = airdropDeployment.address;
  console.log("\nAirdrop Proxy deployed at:", airdropAddress);


  // Grant MINTER_ROLE to AirDrop contract
  console.log("====================");
  console.log("Granting MINTER_ROLE to AirDrop contract");
  console.log("====================");
  
  const tokenContract = await ethers.getContractAt("MyMintableToken",  tokenAddress);
  const MINTER_ROLE = await tokenContract.MINTER_ROLE();
  
  const hasRole = await tokenContract.hasRole(MINTER_ROLE, airdropAddress);
  if (!hasRole) {
    const grantRoleTx = await tokenContract.grantRole(MINTER_ROLE, airdropAddress);
    await grantRoleTx.wait();
    console.log(`MINTER_ROLE granted to: ${airdropAddress}`);
  } else {
    console.log(`AirDrop contract already has MINTER_ROLE.`);
  }
};

func.tags = ["MyMintableToken","airdrop","deploy"];
export default func;
