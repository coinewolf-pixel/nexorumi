const hre = require('hardhat');

async function main() {
  const platformWallet = process.env.PLATFORM_WALLET || (await hre.ethers.getSigners())[0].address;

  const NexorumNFT = await hre.ethers.getContractFactory('NexorumNFT');
  const nft = await NexorumNFT.deploy(platformWallet);

  await nft.waitForDeployment();

  console.log('NexorumNFT deployed to:', await nft.getAddress());
  console.log('Platform wallet:', platformWallet);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
