import * as React from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { BrowserProvider, Contract } from 'ethers';
import { toast } from 'react-toastify';

import { CERTIFICATE_CONTRACT_ABI, CERTIFICATE_CONTRACT_ADDRESS } from '../api/web3';

type Props = {
  walletAddress: string | null;
};

/// Uploads a small JSON metadata document to IPFS via the public web3.storage
/// gateway and returns the resulting CID. Requires VITE_WEB3_STORAGE_TOKEN to
/// be set - if it isn't, we fall back to a locally-computed placeholder hash
/// so the on-chain flow can still be demonstrated end-to-end without a paid
/// pinning service.
const uploadMetadataToIpfs = async (metadata: Record<string, unknown>): Promise<string> => {
  const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN as string | undefined;

  if (!token) {
    // No pinning service configured - derive a deterministic placeholder
    // "hash" from the metadata so the demo flow still works end-to-end.
    // Replace this with a real IPFS upload once a token is available.
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(metadata));
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `local-placeholder-${hex.slice(0, 32)}`;
  }

  const response = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw new Error('Failed to upload certificate metadata to IPFS.');
  }

  const result = await response.json();
  return result.cid as string;
};

export const IssueCertificateForm: React.FC<Props> = ({ walletAddress }) => {
  const [studentName, setStudentName] = React.useState('');
  const [courseName, setCourseName] = React.useState('');
  const [issuing, setIssuing] = React.useState(false);
  const [lastCertificateId, setLastCertificateId] = React.useState<string | null>(null);

  const handleIssue = async () => {
    if (!walletAddress) {
      toast.error('Connect your wallet first.');
      return;
    }
    if (!CERTIFICATE_CONTRACT_ADDRESS) {
      toast.error('Certificate contract address is not configured (VITE_CERTIFICATE_CONTRACT_ADDRESS).');
      return;
    }
    if (!studentName || !courseName) {
      toast.error('Student name and course name are required.');
      return;
    }

    setIssuing(true);
    try {
      const ipfsHash = await uploadMetadataToIpfs({
        studentName,
        courseName,
        issuedAt: new Date().toISOString()
      });

      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CERTIFICATE_CONTRACT_ADDRESS, CERTIFICATE_CONTRACT_ABI, signer);

      const tx = await contract.issueCertificate(studentName, courseName, ipfsHash);
      const receipt = await tx.wait();

      const issuedEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed?.name === 'CertificateIssued');

      const certificateId = issuedEvent?.args?.certificateId?.toString() ?? 'unknown';
      setLastCertificateId(certificateId);
      toast.info(`Certificate #${certificateId} issued successfully.`);
      setStudentName('');
      setCourseName('');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to issue certificate.');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Issue Certificate
      </Typography>

      {!import.meta.env.VITE_WEB3_STORAGE_TOKEN && (
        <Alert severity='info' sx={{ mb: 2 }}>
          No IPFS pinning token configured - metadata will be hashed locally as a
          placeholder. Set VITE_WEB3_STORAGE_TOKEN for real IPFS storage.
        </Alert>
      )}

      <TextField
        label='Student Name'
        fullWidth
        size='small'
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        label='Course / Achievement'
        fullWidth
        size='small'
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant='contained'
        onClick={handleIssue}
        disabled={issuing || !walletAddress}
        startIcon={issuing ? <CircularProgress size={16} color='inherit' /> : undefined}
      >
        {issuing ? 'Issuing...' : 'Issue Certificate'}
      </Button>

      {lastCertificateId && (
        <Alert severity='success' sx={{ mt: 2 }}>
          Certificate issued with ID: {lastCertificateId}
        </Alert>
      )}
    </Box>
  );
};
