import * as React from 'react';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import { toast } from 'react-toastify';

import { connectWallet, hasWeb3Wallet } from '../api/web3';

type Props = {
  address: string | null;
  onConnected: (address: string) => void;
};

const shortenAddress = (address: string): string =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const WalletConnectButton: React.FC<Props> = ({ address, onConnected }) => {
  const [connecting, setConnecting] = React.useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const connectedAddress = await connectWallet();
      onConnected(connectedAddress);
      toast.info('Wallet connected successfully.');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  };

  if (address) {
    return (
      <Stack direction='row' spacing={1} alignItems='center'>
        <Chip
          icon={<AccountBalanceWallet />}
          label={shortenAddress(address)}
          color='success'
          variant='outlined'
        />
      </Stack>
    );
  }

  if (!hasWeb3Wallet()) {
    return (
      <Typography variant='body2' color='text.secondary'>
        No Web3 wallet detected. Install{' '}
        <a href='https://metamask.io' target='_blank' rel='noreferrer'>
          MetaMask
        </a>{' '}
        to issue or verify certificates on-chain.
      </Typography>
    );
  }

  return (
    <Button
      variant='contained'
      startIcon={<AccountBalanceWallet />}
      onClick={handleConnect}
      disabled={connecting}
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
