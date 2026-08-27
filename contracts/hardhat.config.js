require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    // Local Hardhat node (run with: npx hardhat node)
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
