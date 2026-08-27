# Certificate Verification Contracts

Solidity smart contract for issuing and verifying student certificates on-chain (Problem 3).

## Setup

```bash
cd contracts
npm install
```

## Run a local blockchain

```bash
npx hardhat node
```

Keep this running in its own terminal. It starts a local Ethereum node at `http://127.0.0.1:8545` and prints a list of funded test accounts/private keys you can import into MetaMask.

## Compile and deploy

In a second terminal:

```bash
cd contracts
npx hardhat compile
npm run deploy:local
```

The deploy script prints the deployed contract address, e.g.:

```
CertificateVerification deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa
```

Copy that address into `backend/frontend/.env`:

```
VITE_CERTIFICATE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa
```

## Connect MetaMask to the local node

1. Add a network in MetaMask: RPC URL `http://127.0.0.1:8545`, Chain ID `31337`.
2. Import one of the private keys printed by `npx hardhat node`.
3. Open **Certificates** in the admin sidebar (`/app/certificates`), click **Connect Wallet**, issue a certificate, then verify it by ID.

## IPFS metadata

By default (no `VITE_WEB3_STORAGE_TOKEN` set) certificate metadata is hashed locally instead of pinned to IPFS, and the UI shows a banner saying so - this keeps the on-chain issue/verify flow demoable without a paid pinning account. To use real IPFS storage, get a token from [web3.storage](https://web3.storage) and set `VITE_WEB3_STORAGE_TOKEN` in `backend/frontend/.env`.
