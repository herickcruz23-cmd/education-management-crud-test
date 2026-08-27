// Minimal ABI - only the functions/events the frontend actually calls.
// Keeping this hand-written (instead of importing Hardhat's full compiled
// artifact) means the frontend has zero build-time dependency on the
// contracts/ folder being compiled.
export const CERTIFICATE_CONTRACT_ABI = [
  'function issueCertificate(string studentName, string courseName, string ipfsHash) returns (uint256)',
  'function verifyCertificate(uint256 certificateId) view returns (bool exists, bool revoked, address issuer, string studentName, string courseName, string ipfsHash, uint256 issuedAt)',
  'function revokeCertificate(uint256 certificateId)',
  'function totalCertificates() view returns (uint256)',
  'event CertificateIssued(uint256 indexed certificateId, address indexed issuer, string studentName, string ipfsHash)'
];

// Set this after deploying the contract (see contracts/scripts/deploy.js).
export const CERTIFICATE_CONTRACT_ADDRESS = import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS as
  | string
  | undefined;

export type WalletState = {
  address: string | null;
  isConnected: boolean;
};

/// Checks whether a Web3 wallet (MetaMask or similar) is available in the browser.
export const hasWeb3Wallet = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).ethereum);
};

/// Requests the user to connect their wallet and returns the selected address.
export const connectWallet = async (): Promise<string> => {
  if (!hasWeb3Wallet()) {
    throw new Error('No Web3 wallet found. Please install MetaMask.');
  }

  const ethereum = (window as any).ethereum;
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });

  if (!accounts || accounts.length === 0) {
    throw new Error('No account was authorized.');
  }

  return accounts[0];
};
