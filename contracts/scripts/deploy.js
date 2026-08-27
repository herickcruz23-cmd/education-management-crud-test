const hre = require("hardhat");

async function main() {
  const CertificateVerification = await hre.ethers.getContractFactory(
    "CertificateVerification"
  );
  const contract = await CertificateVerification.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CertificateVerification deployed to:", address);
  console.log("");
  console.log("Copy this address into backend/frontend/.env as:");
  console.log(`VITE_CERTIFICATE_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
