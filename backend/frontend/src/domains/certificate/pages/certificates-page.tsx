import * as React from 'react';
import { Box, Paper, Stack, Divider } from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';

import { PageContentHeader } from '@/components/page-content-header';
import { WalletConnectButton, IssueCertificateForm, VerifyCertificate } from '../components';

export const CertificatesPage = () => {
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);

  return (
    <>
      <PageContentHeader icon={<VerifiedUser sx={{ mr: 1 }} />} heading='Certificate Verification' />
      <Box component={Paper} sx={{ padding: '20px' }}>
        <Stack direction='row' justifyContent='flex-end' sx={{ mb: 3 }}>
          <WalletConnectButton address={walletAddress} onConnected={setWalletAddress} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} divider={<Divider orientation='vertical' flexItem />}>
          <IssueCertificateForm walletAddress={walletAddress} />
          <VerifyCertificate />
        </Stack>
      </Box>
    </>
  );
};

export default CertificatesPage;
