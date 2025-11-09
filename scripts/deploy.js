// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Replace with Pancake router for desired network
  // BSC mainnet PancakeSwap v2 router
  const pancakeRouterAddr = process.env.PANCAKE_ROUTER || "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const marketingWallet = process.env.MARKETING_WALLET || deployer.address;

  const NanoBanana = await hre.ethers.getContractFactory("NanoBananaSwap");
  const token = await NanoBanana.deploy(pancakeRouterAddr, marketingWallet);
  await token.deployed();
  console.log("NanoBananaSwap deployed at:", token.address);

  // Print recommended next steps
  console.log("Set fees example: (owner) token.setFees(liquidityBP, marketingBP) e.g., 200,100");
  console.log("Exclude exchange or owner if desired: token.excludeFromFees(address, true)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
