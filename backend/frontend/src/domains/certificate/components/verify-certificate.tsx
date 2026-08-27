import * as React from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import { toast } from 'react-toastify';

import { CERTIFICATE_CONTRACT_ABI, CERTIFICATE_CONTRACT_ADDRESS, hasWeb3Wallet } from '../api/web3';

type CertificateResult = {
  exists: boolean;
  revoked: boolean;
  issuer: string;
  studentName: string;
  courseName: string;
  ipfsHash: string;
  issuedAt: string;
};

const FALLBACK_RPC_URL = (import.meta.env.VITE_RPC_URL as string | undefined) || 'http://127.0.0.1:8545';

export const VerifyCertificate: React.FC = () => {
  const [certificateId, setCertificateId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CertificateResult | null>(null);

  const handleVerify = async () => {
    if (!CERTIFICATE_CONTRACT_ADDRESS) {
      toast.error('Certificate contract address is not configured (VITE_CERTIFICATE_CONTRACT_ADDRESS).');
      return;
    }
    if (!certificateId) {
      toast.error('Enter a certificate ID to verify.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // Verification is read-only, so it works even without a connected
      // wallet - fall back to a plain JSON-RPC provider if MetaMask isn't
      // available, so anyone can verify a certificate.
      const provider = hasWeb3Wallet()
        ? new BrowserProvider((window as any).ethereum)
        : new JsonRpcProvider(FALLBACK_RPC_URL);

      const contract = new Contract(CERTIFICATE_CONTRACT_ADDRESS, CERTIFICATE_CONTRACT_ABI, provider);
      const [exists, revoked, issuer, studentName, courseName, ipfsHash, issuedAt] =
        await contract.verifyCertificate(certificateId);

      if (!exists) {
        toast.error('No certificate found with that ID.');
        return;
      }

      setResult({
        exists,
        revoked,
        issuer,
        studentName,
        courseName,
        ipfsHash,
        issuedAt: new Date(Number(issuedAt) * 1000).toLocaleString()
      });
    } catch (error) {
      toast.error((error as Error).message || 'Failed to verify certificate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Verify Certificate
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label='Certificate ID'
          size='small'
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
          fullWidth
        />
        <Button
          variant='contained'
          onClick={handleVerify}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color='inherit' /> : undefined}
        >
          Verify
        </Button>
      </Box>

      {result && (
        <Paper variant='outlined' sx={{ p: 2 }}>
          {result.revoked && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              This certificate has been revoked.
            </Alert>
          )}
          <Typography variant='body2'>
            <strong>Student:</strong> {result.studentName}
          </Typography>
          <Typography variant='body2'>
            <strong>Course:</strong> {result.courseName}
          </Typography>
          <Typography variant='body2'>
            <strong>Issued by:</strong> {result.issuer}
          </Typography>
          <Typography variant='body2'>
            <strong>Issued at:</strong> {result.issuedAt}
          </Typography>
          <Typography variant='body2'>
            <strong>IPFS metadata:</strong> {result.ipfsHash}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
