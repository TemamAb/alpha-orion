import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("íº€ Deploying AineonFlashLoan to Neon EVM...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Flash Loan Contract
  const FlashLoan = await ethers.getContractFactory("AineonFlashLoan");
  const flashLoan = await FlashLoan.deploy();
  
  await flashLoan.deployed();
  
  console.log("âœ… AineonFlashLoan deployed to:", flashLoan.address);
  console.log("í³Š Transaction hash:", flashLoan.deployTransaction.hash);
  
  // Save deployment info
  const deploymentInfo = {
    network: "neon",
    contract: "AineonFlashLoan",
    address: flashLoan.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: flashLoan.deployTransaction.hash
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    `./deployments/neon-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("í³ Deployment info saved to deployments/");
  
  // Wait for confirmations
  console.log("â³ Waiting for confirmations...");
  await flashLoan.deployTransaction.wait(3);
  
  console.log("í¾‰ Deployment completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
